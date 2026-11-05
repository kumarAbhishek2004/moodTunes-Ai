import TurntablePlayer from '../components/TurntablePlayer';

const MusicPlayerPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-6xl animate-fadeIn">
      <TurntablePlayer isModal={false} />
    </div>
  );
};

export default MusicPlayerPage;
