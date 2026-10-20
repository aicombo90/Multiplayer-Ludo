import React, { useMemo } from 'react';

interface AdBannerProps {
  type?: 'banner_728x90' | 'banner_468x60' | 'rectangle_300x250';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = React.memo(({ type = 'banner_468x60', className = '' }) => {
  const adConfigs = {
    banner_728x90: { key: '2c27af67d644c2d81d6f8eb812b4f5c0', width: 728, height: 90 },
    banner_468x60: { key: 'e8fa617637a13bf5e4fbda0d8786b58e', width: 468, height: 60 },
    rectangle_300x250: { key: '4fa8ce4b2c845ea0d13854e3690e07f9', width: 300, height: 250 },
  };

  const config = adConfigs[type] || adConfigs.banner_468x60;

  const iframeSrcDoc = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        </style>
        <script>
          window.onerror = function() { return true; };
        </script>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '${config.key}',
            'format' : 'iframe',
            'height' : ${config.height},
            'width' : ${config.width},
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highperformanceformat.com/${config.key}/invoke.js"></script>
      </body>
    </html>
  `, [config.key, config.width, config.height]);

  return (
    <div className={`w-full flex items-center justify-center overflow-hidden my-1 ${className}`}>
      <div className="max-w-full overflow-hidden flex items-center justify-center rounded-lg bg-zinc-950/80 border border-amber-500/20 shadow-inner">
        <iframe
          key={type}
          title={`ad-banner-${config.key}`}
          srcDoc={iframeSrcDoc}
          width={config.width}
          height={config.height}
          style={{
            border: 'none',
            maxWidth: '100%',
            maxHeight: `${config.height}px`,
            overflow: 'hidden',
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
});


