<script context="module">
  import { website } from '$lib/config'

  export function getSEOProps({
    title = website.siteTitle,
    description = website.description,
    // TODO: Add default values for featuredImage, ogImage, ogSquareImage, twitterImage
    featuredImage = {
      url: '',
      alt: '',
      width: 0,
      height: 0,
      caption: '',
    },
    ogImage = {
      url: '',
      alt: '',
    },
    ogSquareImage = {
      url: '',
      alt: '',
    },
    twitterImage = {
      url: '',
      alt: '',
    },
  }) {
    const breadcrumbs = [
      {
        name: 'Home',
        slug: '',
      },
    ]

    const entityMeta = null
    return {
      title,
      slug: '',
      entityMeta,
      datePublished: '2024-07-07T14:19:33.000+0100',
      lastUpdated: '2024-07-07T14:19:33.000+0100',
      breadcrumbs,
      metadescription: description,
      featuredImage,
      ogImage,
      ogSquareImage,
      twitterImage,
    }
  }
</script>

<script>


  // import { website } from '$lib/config'
  import { VERTICAL_LINE_ENTITY } from '$lib/utils/entities'
  import OpenGraph from './OpenGraph.svelte'
  import SchemaOrg from './SchemaOrg.svelte'
  import Twitter from './Twitter.svelte'

  const {
    author,
    entity,
    facebookAuthorPage,
    facebookPage,
    ogLanguage,
    siteLanguage,
    siteShortTitle,
    siteTitle,
    siteUrl,
    githubPage,
    linkedinProfile,
    telegramUsername,
    tiktokUsername,
    twitterUsername,
  } = website

  export let article = false
  /**
   * @type {{name:string, slug:string}[]}
   */
  export let breadcrumbs = []
  export let entityMeta = null
  export let lastUpdated
  export let datePublished
  export let metadescription
  export let slug
  export let timeToRead = 0
  export let title

  const defaultAlt =
    'picture of a person with long, curly hair, wearing a red had taking a picture with an analogue camera'

  // imported props with fallback defaults
  export let featuredImage = {
    url: '',
    alt: defaultAlt,
    width: 672,
    height: 448,
    caption: 'Home page',
  }
  export let ogImage = {
    url: '',
    alt: defaultAlt,
  }
  export let ogSquareImage = {
    url: '',
    alt: defaultAlt,
  }
  export let twitterImage = {
    url: '',
    alt: defaultAlt,
  }

  const pageTitle = `${title} ${VERTICAL_LINE_ENTITY} ${siteTitle}`
  const url = `${siteUrl}/${slug}`
  const openGraphProps = {
    article,
    datePublished,
    lastUpdated,
    image: ogImage,
    squareImage: ogSquareImage,
    metadescription,
    ogLanguage,
    pageTitle,
    siteTitle,
    url,
    ...(article
      ? { datePublished, lastUpdated, facebookPage, facebookAuthorPage }
      : {}),
  }
  const schemaOrgProps = {
    article,
    author,
    breadcrumbs,
    datePublished,
    entity,
    lastUpdated,
    entityMeta,
    featuredImage,
    metadescription,
    siteLanguage,
    siteTitle,
    siteTitleAlt: siteShortTitle,
    siteUrl,
    title: pageTitle,
    url,
    facebookPage,
    githubPage,
    linkedinProfile,
    telegramUsername,
    tiktokUsername,
    twitterUsername,
  }
  const twitterProps = {
    title,
    article,
    author,
    twitterUsername,
    image: twitterImage,
    timeToRead,
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={metadescription} />
  <meta
    name="robots"
    content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  />
  <link rel="canonical" href={url} />
</svelte:head>
<Twitter {...twitterProps} />
<OpenGraph {...openGraphProps} />
<SchemaOrg {...schemaOrgProps} />
