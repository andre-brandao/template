<script>
  export let hashtag = ''
  export let quote = ''
  export let url

  const FACEBOOK_BLUE = '#3b5998'

  const baseUrl = 'https://www.facebook.com/sharer/sharer.php'
  const parametersObject = {
    u: url,
    ...(quote !== '' ? { quote } : {}),
    ...(hashtag !== '' ? { hashtag } : {}),
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

<button on:click={handleClick} class="">
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
    class="lucide lucide-facebook"
  >
    <path
      d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
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
