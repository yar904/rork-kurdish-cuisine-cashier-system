import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        

        <meta name="theme-color" content="#D84315" />
        <meta name="description" content="Complete restaurant management system for Tapse Kurdish Restaurant - Ordering, Kitchen Operations, and Analytics" />
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/assets/images/favicon.png" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tapse" />
        
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Tapse" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Tapse Kurdish Restaurant System" />
        <meta property="og:description" content="Complete restaurant management system" />
        <meta property="og:site_name" content="Tapse" />
        
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes cornerGlow {
            0%, 100% {
              box-shadow:
                0 0 30px rgba(212, 175, 55, 0.15),
                -8px -8px 24px rgba(212, 175, 55, 0.1),
                8px 8px 24px rgba(212, 175, 55, 0.1),
                inset 0 0 20px rgba(212, 175, 55, 0.05);
            }
            50% {
              box-shadow:
                0 0 35px rgba(212, 175, 55, 0.3),
                -10px -10px 28px rgba(212, 175, 55, 0.25),
                10px 10px 28px rgba(212, 175, 55, 0.25),
                inset 0 0 25px rgba(212, 175, 55, 0.12);
            }
          }
          
          @keyframes cornerGlowPremium {
            0%, 100% {
              box-shadow:
                0 0 40px rgba(212, 175, 55, 0.2),
                -10px -10px 30px rgba(212, 175, 55, 0.15),
                10px 10px 30px rgba(212, 175, 55, 0.15),
                inset 0 0 25px rgba(212, 175, 55, 0.08);
            }
            50% {
              box-shadow:
                0 0 50px rgba(212, 175, 55, 0.35),
                -12px -12px 36px rgba(212, 175, 55, 0.3),
                12px 12px 36px rgba(212, 175, 55, 0.3),
                inset 0 0 30px rgba(212, 175, 55, 0.18);
            }
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
