import { Box } from "@axelor/ui";
import { useState } from "react";
import { useEffect } from "react";
import { translate } from "../../utils";

const LoadingAnimation = ({ loadingTexts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setCurrentIndex(
          (currentIndex) => (currentIndex + 1) % loadingTexts.length
        );
        setIsFadingOut(false);
      }, 600);
    }, 1000);

    return () => clearInterval(interval);
  }, [loadingTexts.length, currentIndex]);

  return (
    <Box
      id="page"
      d="flex"
      justifyContent="center"
      bg="body"
      style={{ height: "90vh" }}
    >
      <Box
        id="phrase_box"
        color="body"
        pb={4}
        style={{ width: "min(500px, 80%)", height: "450px" }}
      >
        <svg width="100%" height="100%">
          <defs>
            <mask
              id="mask"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
            >
              <linearGradient
                id="linearGradient"
                gradientUnits="objectBoundingBox"
                x2="0"
                y2="1"
              >
                <stop stopColor="white" stopOpacity="0.3" offset="0%" />
                <stop stopColor="white" stopOpacity="1" offset="30%" />
                <stop stopColor="white" stopOpacity="1" offset="70%" />
                <stop stopColor="white" stopOpacity="0.2" offset="100%" />
              </linearGradient>
              <rect
                width="100%"
                height="100%"
                fill="url(#linearGradient)"
              ></rect>
            </mask>
          </defs>
          <g width="100%" height="100%" style={{ mask: "url(#mask)" }}>
            <g id="phrases">
              <text
                fill="var(--bs-body-color)"
                x="80"
                y="200"
                fontSize="24"
                fontFamily="Cerebri Sans"
                className={isFadingOut ? "fade-out" : "fade-in"}
              >
                {translate(loadingTexts[currentIndex])}
              </text>
            </g>
          </g>
        </svg>
      </Box>
    </Box>
  );
};

export default LoadingAnimation;
