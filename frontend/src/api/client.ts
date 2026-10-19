const API_URL = "http://127.0.0.1:8000";


function getAccessToken() {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token")
  );
}


function getRefreshToken() {
  return (
    localStorage.getItem("refresh_token") ||
    sessionStorage.getItem("refresh_token")
  );
}


function saveAccessToken(token: string) {
  if (localStorage.getItem("refresh_token")) {
    localStorage.setItem("access_token", token);
  } else {
    sessionStorage.setItem("access_token", token);
  }
}


async function refreshAccessToken() {
  const refresh = getRefreshToken();

  if (!refresh) {
    return null;
  }

  const response = await fetch(
    `${API_URL}/api/auth/refresh/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh,
      }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  saveAccessToken(data.access);

  return data.access;
}


export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  let token = getAccessToken();

  let response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...options.headers,
      },
    }
  );


  if (response.status === 401) {
    const newAccessToken =
      await refreshAccessToken();

    if (newAccessToken) {
      token = newAccessToken;

      response = await fetch(
        `${API_URL}${endpoint}`,
        {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
        }
      );
    }
  }


  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status}`
    );
  }


  // DELETE usually returns 204 No Content
  if (response.status === 204) {
    return null;
  }


  const contentType =
    response.headers.get("content-type");

  if (
    !contentType?.includes("application/json")
  ) {
    return null;
  }


  return response.json();
}


export { API_URL };