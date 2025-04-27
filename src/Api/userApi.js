import axios from 'axios';
const API_URL = 'http://localhost:5140/api/user';

export const getUsers = () => axios.get(API_URL);
export const createUser = (data) => axios.post(API_URL, data);