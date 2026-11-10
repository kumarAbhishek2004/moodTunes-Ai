FROM python:3.10-slim

WORKDIR /app

# Install system dependencies needed for OpenCV and media handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install uv for lightning-fast package resolution & installation (eliminates pip backtracking)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy requirements first for better caching
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port (standard for Hugging Face Spaces)
EXPOSE 7860

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]