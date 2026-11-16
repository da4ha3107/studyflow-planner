const getApiBaseUrl = () => {
  const host = window.location.hostname;
  return `http://${host}:4000/api`;
};

export const API_URL = getApiBaseUrl();

export function getAuthHeaders() {
  const token = localStorage.getItem('studyflow_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}
