const runtimeScope = typeof window !== 'undefined'
  ? window
  : typeof globalThis !== 'undefined'
    ? globalThis
    : {};

const readString = (key) => {
  const value = runtimeScope?.[key];
  return typeof value === 'string' ? value.trim() : '';
};

const getMraid = () => {
  const candidate = runtimeScope?.mraid;

  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  return candidate;
};

const createOnce = (callback) => {
  let called = false;

  return (...args) => {
    if (called) {
      return;
    }

    called = true;
    callback?.(...args);
  };
};

const detectPlatform = () => {
  const userAgent = runtimeScope?.navigator?.userAgent?.toLowerCase?.() ?? '';

  return {
    isAndroid: userAgent.includes('android'),
    isIOS: /iphone|ipad|ipod/.test(userAgent),
  };
};

const getStoreUrl = () => {
  if (typeof runtimeScope.getPlayableStoreUrl === 'function') {
    return runtimeScope.getPlayableStoreUrl();
  }

  const platform = detectPlatform();

  if (platform.isIOS) {
    return readString('IOS_STORE_URL') || readString('STORE_URL') || readString('ANDROID_STORE_URL');
  }

  if (platform.isAndroid) {
    return readString('ANDROID_STORE_URL') || readString('STORE_URL') || readString('IOS_STORE_URL');
  }

  return readString('STORE_URL') || readString('ANDROID_STORE_URL') || readString('IOS_STORE_URL');
};

export const installPlayableCta = () => {
  runtimeScope.playableCTAClick = () => {
    const targetUrl = getStoreUrl();

    if (!targetUrl) {
      console.warn('CTA URL is not configured. Set STORE_URL and/or platform-specific store URLs.');
      return false;
    }

    if (typeof runtimeScope.playableOpenStoreUrl === 'function') {
      return runtimeScope.playableOpenStoreUrl(targetUrl);
    }

    const mraid = getMraid();

    if (mraid && typeof mraid.open === 'function') {
      mraid.open(targetUrl);
      return true;
    }

    runtimeScope.open?.(targetUrl, '_blank');
    return true;
  };
};

export const bootstrapPlayable = ({ onStart, onViewableChange } = {}) => {
  const startOnce = createOnce(() => {
    onStart?.();
  });

  const notifyViewableChange = (viewable, source) => {
    const normalizedViewable = Boolean(viewable);

    runtimeScope.dispatchEvent?.(new CustomEvent('playableViewabilityChange', {
      detail: {
        viewable: normalizedViewable,
        source,
      },
    }));

    onViewableChange?.(normalizedViewable, source);
  };

  const mraid = getMraid();

  if (!mraid || typeof mraid.getState !== 'function') {
    notifyViewableChange(true, 'browser');
    startOnce();
    return () => {};
  }

  const removers = [];

  const addMraidListener = (eventName, handler) => {
    if (typeof mraid.addEventListener !== 'function') {
      return;
    }

    mraid.addEventListener(eventName, handler);

    removers.push(() => {
      if (typeof mraid.removeEventListener === 'function') {
        mraid.removeEventListener(eventName, handler);
      }
    });
  };

  const handleViewableChange = (viewable) => {
    const normalizedViewable = Boolean(viewable);
    notifyViewableChange(normalizedViewable, 'mraid-viewable');

    if (normalizedViewable) {
      startOnce();
    }
  };

  const handleExposureChange = (exposedPercentage) => {
    const normalizedViewable = Number(exposedPercentage) > 0;
    notifyViewableChange(normalizedViewable, 'mraid-exposure');

    if (normalizedViewable) {
      startOnce();
    }
  };

  const handleStateChange = (state) => {
    const isHidden = state === 'hidden';
    notifyViewableChange(!isHidden, 'mraid-state');
  };

  const onSdkReady = () => {
    addMraidListener('viewableChange', handleViewableChange);
    addMraidListener('exposureChange', handleExposureChange);
    addMraidListener('stateChange', handleStateChange);

    let initialViewable = true;

    if (typeof mraid.isViewable === 'function') {
      initialViewable = mraid.isViewable();
    }

    handleViewableChange(initialViewable);
  };

  if (mraid.getState() === 'loading') {
    addMraidListener('ready', onSdkReady);
  } else {
    onSdkReady();
  }

  return () => {
    removers.forEach((removeListener) => removeListener());
  };
};
