/**
 * 技能樹縮放和旋轉相關的工具函數
 */

/**
 * 計算以視口中心為錨點的縮放
 * @param {HTMLElement} container - 滾動容器元素
 * @param {number} oldZoom - 當前縮放比例
 * @param {number} newZoom - 新的縮放比例
 * @returns {Object} 包含新滾動位置的對象 { scrollLeft, scrollTop }
 */
export const calculateZoomWithCenter = (container, oldZoom, newZoom) => {
  if (!container) {
    return null;
  }

  // 獲取容器的尺寸和當前滾動位置
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const scrollLeft = container.scrollLeft;
  const scrollTop = container.scrollTop;

  // 計算視口中心在內容中的位置（相對於內容的左上角）
  const centerX = scrollLeft + containerWidth / 2;
  const centerY = scrollTop + containerHeight / 2;

  // 計算視口中心在技能樹坐標系中的相對位置（0-1之間）
  const relativeX = centerX / (containerWidth * oldZoom);
  const relativeY = centerY / (containerHeight * oldZoom);

  // 計算新的內容尺寸下，相同相對位置的絕對位置
  const newCenterX = relativeX * containerWidth * newZoom;
  const newCenterY = relativeY * containerHeight * newZoom;

  // 計算新的滾動位置，使視口中心對準相同的相對位置
  const newScrollLeft = newCenterX - containerWidth / 2;
  const newScrollTop = newCenterY - containerHeight / 2;

  return {
    scrollLeft: newScrollLeft,
    scrollTop: newScrollTop
  };
};

/**
 * 創建縮放處理函數
 * @param {React.RefObject} containerRef - 容器的 ref
 * @param {number} currentZoom - 當前縮放比例
 * @param {Function} setZoom - 設置縮放比例的函數
 * @returns {Function} 處理縮放的函數
 */
export const createZoomHandler = (containerRef, currentZoom, setZoom) => {
  return (newZoom) => {
    if (!containerRef.current) {
      setZoom(newZoom);
      return;
    }

    const container = containerRef.current;
    const scrollPosition = calculateZoomWithCenter(container, currentZoom, newZoom);

    // 更新縮放
    setZoom(newZoom);

    // 使用 requestAnimationFrame 確保 DOM 更新後再調整滾動位置
    if (scrollPosition) {
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        container.scrollLeft = scrollPosition.scrollLeft;
        container.scrollTop = scrollPosition.scrollTop;
      });
    }
  };
};

/**
 * 創建縮放控制函數
 * @param {number} currentZoom - 當前縮放比例
 * @param {Function} zoomHandler - 縮放處理函數
 * @param {number} minZoom - 最小縮放比例，默認 0.4
 * @param {number} maxZoom - 最大縮放比例，默認 3
 * @param {number} zoomStep - 縮放步長，默認 0.2
 * @returns {Object} 包含縮放控制函數的對象
 */
export const createZoomControls = (
  currentZoom,
  zoomHandler,
  minZoom = 0.4,
  maxZoom = 3,
  zoomStep = 0.2
) => {
  return {
    zoomIn: () => {
      const newZoom = Math.min(currentZoom + zoomStep, maxZoom);
      zoomHandler(newZoom);
    },
    zoomOut: () => {
      const newZoom = Math.max(currentZoom - zoomStep, minZoom);
      zoomHandler(newZoom);
    },
    zoomReset: () => {
      zoomHandler(1);
    }
  };
};

/**
 * 創建旋轉控制函數
 * @param {number} currentRotation - 當前旋轉角度
 * @param {Function} setRotation - 設置旋轉角度的函數
 * @param {number} rotationStep - 旋轉步長（度），默認 30
 * @returns {Object} 包含旋轉控制函數的對象
 */
export const createRotationControls = (
  currentRotation,
  setRotation,
  rotationStep = 30
) => {
  return {
    rotateLeft: () => {
      setRotation((prevRotation) => (prevRotation - rotationStep + 360) % 360);
    },
    rotateRight: () => {
      setRotation((prevRotation) => (prevRotation + rotationStep) % 360);
    },
    rotateReset: () => {
      setRotation(0);
    }
  };
};

/**
 * 計算應用旋轉後的節點角度
 * @param {number} originalAngle - 原始角度（弧度）
 * @param {number} rotationDegrees - 旋轉角度（度）
 * @returns {number} 調整後的角度（弧度）
 */
export const applyRotation = (originalAngle, rotationDegrees) => {
  const rotationRad = (rotationDegrees * Math.PI) / 180;
  return originalAngle + rotationRad;
};

/**
 * 將角度標準化到 0-360 度範圍內
 * @param {number} degrees - 角度（度）
 * @returns {number} 標準化後的角度（度）
 */
export const normalizeAngle = (degrees) => {
  return ((degrees % 360) + 360) % 360;
};

/**
 * 創建自動旋轉控制器
 * @param {Function} setRotation - 設置旋轉角度的函數
 * @param {number} speed - 旋轉速度（度/秒），默認 30
 * @returns {Object} 包含自動旋轉控制函數的對象
 */
export const createAutoRotationController = (setRotation, speed = 30) => {
  let animationFrameId = null;
  let lastTimestamp = null;
  
    lastTimestamp = performance.now();
    
    const animate = (timestamp) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }
      
      const deltaTime = (timestamp - lastTimestamp) / 1000; // 轉換為秒
      const rotationDelta = speed * deltaTime;
      
      setRotation((prevRotation) => normalizeAngle(prevRotation + rotationDelta));
      
      lastTimestamp = timestamp;
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
  };
  
  const stop = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
      lastTimestamp = null;
    }
  };
  
  const isRunning = () => {
    return animationFrameId !== null;
  };
  
  return {
    start,
    stop,
    isRunning
  };
};

