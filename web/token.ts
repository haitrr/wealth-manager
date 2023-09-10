const cookieName = 'token';
const expirationDays = 7;
export function setJwtCookie(token: string) {
    // Calculate the expiration date for the cookie
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    // Convert the token to a string
    const tokenString = encodeURIComponent(token);

    // Create the cookie string
    const cookieValue = `${cookieName}=${tokenString}; expires=${expirationDate.toUTCString()}; path=/; HttpOnly; Secure`;

    // Set the cookie
    document.cookie = cookieValue;
}

function getTokenFromCookie() {
    console.log(document.cookie)
    // Get the value of the specified cookie by name
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === cookieName) {
            // Decode the URI-encoded token
            const token = decodeURIComponent(value);
            if (token !== undefined && token !== null && token !== '') {
                return token
            }
            return null;
        }
    }

    // If the cookie is not found, return null
    return null;
}

