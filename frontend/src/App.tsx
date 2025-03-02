import axios from 'axios';
import { FormEvent, useRef, useState } from 'react';

const App = () => {
  const questionRef = useRef<HTMLInputElement>(null);
  const [answer, setAnswer] = useState("");

  async function handleGetAnswer(e: FormEvent){
    e.preventDefault();
    if(!questionRef.current){
      return;
    }
    const question = questionRef.current.value;
    const {data: response} = await axios.post(`${import.meta.env.VITE_BASE_URL}/question`,{question});
    if(response.success){
      setAnswer(response.data);
    }
  }


  return (
    <div>
      <form onSubmit={handleGetAnswer}>
      <div>
        <label htmlFor='question'>write your question</label>
        <input id='question' type='text' ref={questionRef}/>
      </div>
      <button type='submit'>Get Answer</button>
    </form>
    <div>
      <h3>Answer: <p>{answer ? answer : ""}</p></h3>
    </div>
    </div>
  )
}

export default App