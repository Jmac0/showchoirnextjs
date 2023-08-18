import axios from "axios";
import { useState } from "react";

interface RequestConfig {
  url: string;
  method: string;
  withCredentials: boolean;
  token?: string;
}

type ResponseData = {
  authorisation_url?: string;
};

function useHttp(requestConfig: RequestConfig) {
  const [loading, setLoading] = useState(false);
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [message, setMessage] = useState("");
  const [responseData, setResponseData] = useState<ResponseData>();
  // function returned from this hook
  const sendRequest = async <T>(
    body?: T,
    callback?: (response: { data: T }) => T
  ) => {
    setLoading(true);
    await axios({
      method: requestConfig.method ? requestConfig.method : "GET",
      url: requestConfig.url,
      data: body || undefined,
      headers: {
        Authorization: `Bearer ${requestConfig.token || ""} `,
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
      },
      withCredentials: requestConfig.withCredentials,
    })
      .then((response) => {
        setIsErrorMessage(false);
        setShowUserMessage(true);
        setMessage(response.data.message);
        setResponseData(response.data);
        setTimeout(() => {
          setLoading(false);
        }, 300);

        // callback from hook call
        if (callback) {
          callback(response.data);
        }
      })

      .catch((err) => {
        setIsErrorMessage(true);
        setShowUserMessage(true);
        setMessage(err.response.data.message);
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 300);
      });
  };
  return {
    loading,
    message,
    setMessage,
    setLoading,
    sendRequest,
    showUserMessage,
    responseData,
    setResponseData,
    setShowUserMessage,
    isErrorMessage,
    setIsErrorMessage,
  };
}

export default useHttp;
