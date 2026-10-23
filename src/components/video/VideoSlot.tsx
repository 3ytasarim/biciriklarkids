import type { VideoSlot as VideoRow } from "@/lib/content/queries";
import { LazyVideo } from "./LazyVideo";
import { VideoPlaceholder } from "./VideoPlaceholder";

/**
 * Video alanı: admin'de (Admin › Videolar) slot için URL girilmişse gerçek video, değilse aynı oranlarda
 * "VideoTest" yer tutucusu. Sayfa tarafı yalnızca slot adını ve varsayılan oranı bilir.
 */
export function VideoSlot({
  slot,
  video,
  aspectRatio = "16/9",
  mobileAspectRatio = "4/5",
  fallbackTitle,
  className,
  rounded,
}: {
  slot: string;
  video: VideoRow | undefined;
  aspectRatio?: string;
  mobileAspectRatio?: string;
  fallbackTitle: string;
  className?: string;
  rounded?: boolean;
}) {
  const ar = video?.aspectRatio || aspectRatio;
  const arM = video?.mobileAspectRatio || mobileAspectRatio;
  if (!video?.desktopUrl) {
    return <VideoPlaceholder label="VideoTest" slot={slot} aspectRatio={ar} mobileAspectRatio={arM} className={className} rounded={rounded} />;
  }
  return (
    <LazyVideo
      src={video.desktopUrl}
      mobileSrc={video.mobileUrl}
      poster={video.posterUrl}
      mobilePoster={video.mobilePosterUrl}
      aspectRatio={ar}
      mobileAspectRatio={arM}
      title={video.title || fallbackTitle}
      autoplay={video.autoplay}
      loop={video.loop}
      className={className}
      rounded={rounded}
    />
  );
}
