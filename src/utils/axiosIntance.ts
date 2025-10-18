import axios from 'axios';

const axiosInstance = axios.create({
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// export function setAuthToken(token: string | null) {
//     if (token) {
//         axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     } else {
//         delete axiosInstance.defaults.headers.common['Authorization'];
//     }
// }

export default axiosInstance;