import {ErrorResponse} from 'hybrid-types/MessageTypes';
import { formatDistanceToNow } from 'date-fns';

const fetchData = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  console.log('fetching data from url: ', url);
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok) {
    const errorJson = json as unknown as ErrorResponse;
    console.log('errorJson', errorJson);
    if (errorJson.message) {
      throw new Error(errorJson.message);
    }
    throw new Error(`Error ${response.status} occured`);
  }
  return json;
};

const formatDateToTimePassed = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true});
};

export {fetchData, formatDateToTimePassed};
