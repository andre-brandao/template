/* eslint-disable @typescript-eslint/no-unused-vars */
import { website } from '$lib/config'

export function getSEOProps(params: {
  title: string
  featuredImage: {
    src: string
    alt: string
  }
  ogImageSrc: string
  ogSquareImageSrc: string
  twitterImageSrc: string
}) {
  const {
    title,
    featuredImage: { src: featuredImageSrc, alt: featuredImageAlt },
    ogImageSrc,
    ogSquareImageSrc,
    twitterImageSrc,
  } = params
  const { author, siteUrl, description } = website

  const breadcrumbs = [
    {
      name: 'Home',
      slug: '',
    },
  ]
  const metadescription = description
  const featuredImage = {
    url: featuredImageSrc,
    alt: featuredImageAlt,
    width: 672,
    height: 448,
    caption: 'Home page',
  }
  const ogImage = {
    url: ogImageSrc,
    alt: featuredImageAlt,
  }
  const ogSquareImage = {
    url: ogSquareImageSrc,
    alt: featuredImageAlt,
  }

  const twitterImage = {
    url: twitterImageSrc,
    alt: featuredImageAlt,
  }
  //   const entityMeta = {
  //     url: `${siteUrl}/`,
  //     faviconWidth: 512,
  //     faviconHeight: 512,
  //     caption: author,
  //   }
  const entityMeta = null
  return {
    title,
    slug: '',
    entityMeta,
    datePublished: '2024-07-07T14:19:33.000+0100',
    lastUpdated: '2024-07-07T14:19:33.000+0100',
    breadcrumbs,
    metadescription,
    featuredImage,
    ogImage,
    ogSquareImage,
    twitterImage,
  }
}
