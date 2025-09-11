import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
  type?: 'website' | 'article' | 'profile';
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'GradApp - Graduate School Platform',
  description = 'Streamline your graduate school journey with smart university matching, scholarship discovery, and faculty connections.',
  keywords = 'graduate school, university matching, scholarship discovery, faculty connections, grad school applications',
  ogImage = '/favicon-512x512.svg',
  canonical,
  noIndex = false,
  type = 'website'
}) => {
  const fullTitle = title === 'GradApp - Graduate School Platform' 
    ? title 
    : `${title} | GradApp`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Favicon - ensuring it's always present */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/svg+xml" sizes="16x16" href="/favicon-16x16.svg" />
      <link rel="icon" type="image/svg+xml" sizes="32x32" href="/favicon-32x32.svg" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      
      {/* SEO Meta Tags */}
      {canonical && <link rel="canonical" href={canonical} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="GradApp" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* App-specific Meta Tags */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="application-name" content="GradApp" />
      <meta name="apple-mobile-web-app-title" content="GradApp" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Additional PWA Meta Tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="format-detection" content="telephone=no" />
    </Helmet>
  );
};

export default SEOHead;