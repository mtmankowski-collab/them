export const getWhoAmI = () => localStorage.getItem('them_whoami') || 'a'
export const setWhoAmI = (v) => localStorage.setItem('them_whoami', v)
