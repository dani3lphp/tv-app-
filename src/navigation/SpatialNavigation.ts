import { useEffect } from "react";

// Standard TV and browser key code maps
export const KEYS = {
  UP: ["ArrowUp", "38", "403"],
  DOWN: ["ArrowDown", "40", "412"],
  LEFT: ["ArrowLeft", "37", "412"],
  RIGHT: ["ArrowRight", "39", "417"],
  OK: ["Enter", " ", "13", "32"],
  BACK: ["Backspace", "Escape", "8", "27", "10009"]
};

/**
 * Finds the geometric center of a DOMRect
 */
function getCenter(rect: DOMRect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

/**
 * Spatial Navigation engine. Calculates which element is closest in a given direction.
 */
export function navigateSpatial(direction: "UP" | "DOWN" | "LEFT" | "RIGHT", currentEl: HTMLElement): HTMLElement | null {
  const elements = Array.from(document.querySelectorAll(".focusable")) as HTMLElement[];
  if (elements.length <= 1) return null;

  const currentRect = currentEl.getBoundingClientRect();
  const currentCenter = getCenter(currentRect);

  let bestElement: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const el of elements) {
    if (el === currentEl || el.getAttribute("aria-disabled") === "true") continue;

    const rect = el.getBoundingClientRect();
    const center = getCenter(rect);

    // Check if element is in the correct directional semi-plane/cone
    let isMatch = false;
    let primaryDiff = 0;
    let secondaryDiff = 0;

    switch (direction) {
      case "UP":
        isMatch = rect.bottom <= currentRect.top + 5; // Allow minor overlaps
        primaryDiff = currentCenter.y - center.y;
        secondaryDiff = Math.abs(currentCenter.x - center.x);
        break;
      case "DOWN":
        isMatch = rect.top >= currentRect.bottom - 5;
        primaryDiff = center.y - currentCenter.y;
        secondaryDiff = Math.abs(currentCenter.x - center.x);
        break;
      case "LEFT":
        isMatch = rect.right <= currentRect.left + 5;
        primaryDiff = currentCenter.x - center.x;
        secondaryDiff = Math.abs(currentCenter.y - center.y);
        break;
      case "RIGHT":
        isMatch = rect.left >= currentRect.right - 5;
        primaryDiff = center.x - currentCenter.x;
        secondaryDiff = Math.abs(currentCenter.y - center.y);
        break;
    }

    if (!isMatch) continue;

    // Spatial score formula prioritizing alignment along primary direction
    // Score = primary distance + 2.5 * secondary distance (orthogonal cost)
    const score = primaryDiff + 2.5 * secondaryDiff;

    if (score < bestScore) {
      bestScore = score;
      bestElement = el;
    }
  }

  return bestElement;
}

/**
 * Global hook to bind key listeners for remote controls
 */
export function useTVNavigation(
  active: boolean,
  currentRoute: string,
  onNavigate: (dir: "UP" | "DOWN" | "LEFT" | "RIGHT") => void,
  onBack: () => void,
  onOK: () => void
) {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Unify keys
      let direction: "UP" | "DOWN" | "LEFT" | "RIGHT" | null = null;
      let isOK = false;
      let isBack = false;

      if (KEYS.UP.includes(key)) direction = "UP";
      else if (KEYS.DOWN.includes(key)) direction = "DOWN";
      else if (KEYS.LEFT.includes(key)) direction = "LEFT";
      else if (KEYS.RIGHT.includes(key)) direction = "RIGHT";
      else if (KEYS.OK.includes(key)) isOK = true;
      else if (KEYS.BACK.includes(key)) isBack = true;

      if (direction) {
        e.preventDefault();
        onNavigate(direction);
      } else if (isOK) {
        e.preventDefault();
        onOK();
      } else if (isBack) {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, onNavigate, onBack, onOK]);
}
