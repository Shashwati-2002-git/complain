import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

const googleLogin = async (token) => {
  const res = await axios.post(`${API_URL}/google`, { token });
  return res.data;
};

export default { googleLogin };
