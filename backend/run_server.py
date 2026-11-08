"""
MoodTunes AI - Multi-Worker High-Concurrency Server Launcher
Enables true multi-user multitasking and multiprocessing across all CPU cores.
"""
import sys
import os
import argparse
import multiprocessing

if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def print_banner(mode: str, workers: int, host: str, port: int):
    cpu_cores = os.cpu_count() or 1
    display_host = '127.0.0.1' if host == '0.0.0.0' else host
    print("\n" + "=" * 74)
    print(" [MoodTunes AI] High-Concurrency Music Recommendation Server")
    print("=" * 74)
    print(f" * CPU Cores Available       : {cpu_cores}")
    print(f" * Active Worker Processes   : {workers} ({mode})")
    print(f" * Server Endpoint           : http://{display_host}:{port}")
    print(f" * Interactive API Docs      : http://{display_host}:{port}/docs")
    print(f" * Storage Concurrency       : PID/UUID Atomic Disk + Atlas Replica")
    print("=" * 74 + "\n")

def main():
    multiprocessing.freeze_support()

    cpu_cores = os.cpu_count() or 1
    default_workers = min(max(1, cpu_cores), 4)

    parser = argparse.ArgumentParser(
        description="MoodTunes AI Multi-Worker Server Launcher",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_server.py                     # Run with auto-detected CPU worker count
  python run_server.py --workers 4         # Run with 4 dedicated parallel worker processes
  python run_server.py --dev               # Run in single-worker dev mode with live reload
  python run_server.py --port 8080         # Run on custom port
        """
    )
    parser.add_argument(
        "--workers", "-w",
        type=int,
        default=default_workers,
        help=f"Number of parallel worker processes (default: {default_workers})"
    )
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Run in development mode (single-worker with hot auto-reload)"
    )
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=8000,
        help="Port to bind server (default: 8000)"
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host interface to bind server (default: 0.0.0.0)"
    )

    args = parser.parse_args()

    # Add backend directory to sys.path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    import uvicorn

    if args.dev:
        num_workers = 1
        mode_str = "Single-Worker Live Reload (Dev)"
        print_banner(mode_str, num_workers, args.host, args.port)
        uvicorn.run("main:app", host=args.host, port=args.port, reload=True)
    else:
        num_workers = args.workers
        mode_str = "Multiprocessing Parallel Pool"
        print_banner(mode_str, num_workers, args.host, args.port)
        uvicorn.run("main:app", host=args.host, port=args.port, workers=num_workers)

if __name__ == "__main__":
    main()
