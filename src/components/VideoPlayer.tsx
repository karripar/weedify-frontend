import {useVideoPlayer, VideoView, VideoViewProps} from 'expo-video';

type VideoPlayerProps = {
  videoFile: string;
} & Omit<VideoViewProps, 'player'>;

const VideoPlayer = ({videoFile, ...props}: VideoPlayerProps) => {
  const player = useVideoPlayer(videoFile, (player) => {
    player.loop = true;
    player.play();
  });
  return <VideoView player={player} {...props} />;
};

export default VideoPlayer;
