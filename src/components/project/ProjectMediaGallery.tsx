import React from "react";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";

interface MediaItem {
  type: "image" | "video";
  url: string;
}

interface ProjectMediaGalleryProps {
  media: MediaItem[];
  className?: string;
}

const ProjectMediaGallery: React.FC<ProjectMediaGalleryProps> = ({ media, className }) => {
  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    mode: "snap",
    slides: { perView: 1, spacing: 16 },
  });

  if (!media || media.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-[#18181b] border border-zinc-700 rounded-lg text-zinc-500">
        No media available
      </div>
    );
  }

  return (
    <div
      ref={sliderRef}
      className={`keen-slider w-full rounded-xl overflow-hidden ${className || "max-w-5xl"}`}
    >
      {media.map((item, idx) => (
        <div
          className="keen-slider__slide flex items-center justify-center bg-[#18181b]"
          key={idx}
        >
          {item.type === "image" ? (
            <img
              src={item.url}
              alt={`Screenshot ${idx + 1}`}
              className="max-h-64 w-auto object-contain rounded-lg border border-zinc-700"
              style={{ maxWidth: "100%" }}
            />
          ) : (
            <video
              src={item.url}
              controls
              className="max-h-64 w-auto object-contain rounded-lg border border-zinc-700"
              style={{ maxWidth: "100%" }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ProjectMediaGallery;
