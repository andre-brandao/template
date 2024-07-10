<script>
  export let hashtags = [] // array of hashtags exclude '#' e.g. ['svelte', 'askRodney']
  export let quote = undefined
  export let related = [] // array of Twitter users (including '@')
  export let title // text in Tweet
  export let url
  export let via = '' // include '@' e.g. '@askRodney'

  const TWITTER_BLUE = '#00aced'

  const baseUrl = 'https://twitter.com/share'
  const parametersObject = {
    url,
    ...(hashtags.length > 0 ? { hashtags: hashtags.join(',') } : {}),
    quote,
    text: title,
    ...(related.length > 0 ? { related: related.join(',') } : {}),
    ...(via.length > 0 ? { via: via.slice(1) } : {}),
  }

  const params = Object.entries(parametersObject)
    .filter(([, value]) => value ?? false)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&')

  const urlWithParameters = params === '' ? baseUrl : `${baseUrl}?${params}`

  function handleClick() {
    const config = {
      height: 550,
      width: 400,
      location: 'no',
      toolbar: 'no',
      status: 'no',
      directories: 'no',
      menubar: 'no',
      scrollbars: 'yes',
      resizable: 'no',
      centerscreen: 'yes',
      chrome: 'yes',
    }
    return window.open(
      urlWithParameters,
      '',
      Object.keys(config)
        .map(key => `${key}=${config[key]}`)
        .join(','),
    )
  }
</script>

<button on:click={handleClick}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="lucide lucide-twitter"
  >
    <path
      d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"
    />
  </svg>
</button>

<style>
  button {
    background: transparent;
    border-style: none;
    transition: all 0.2s ease-in-out;
  }

  @media (prefers-reduced-motion: reduce) {
    button {
      transition: all 2s ease-in-out;
    }
  }

  button:focus,
  button:hover {
    transform: scale(1.1);
  }

  @media screen and (max-width: 1024px) {
    button {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
  }
</style>
