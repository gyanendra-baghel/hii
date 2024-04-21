import { FormEvent, useContext, useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { io } from "socket.io-client"
import { UserContext } from "../context/UserContext";
import { Message } from "../@types/Message";

function Chat() {
    let {username,socket,setSocket,messages,setMessages}=useContext(UserContext);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [sidebar, setSidebar] = useState("hide");
    const [currentInput, setCurrentInput] = useState<string>("");
    const { receiver } = useParams<{receiver?: string }>();
    if(!username)  location.href="/";
    
    useEffect(()=> {
        if(!socket){
            socket = io('https://chat-backend-qj8w.onrender.com/', {
                withCredentials: true,
                reconnectionDelay: 1000*5, // defaults to 1000
                reconnectionDelayMax: 1000*10, // defaults to 5000
                query: { username }
            });
            socket.on("connect",()=>{
                setSocket(socket);
                console.log("Connected: ");
            });
            socket.on('message', (msg:Message)=>{
                 setMessages((prev:Message[])=>[...prev,msg]);
            });
            socket.on('updateUser', (userList: string[]) => {
                setOnlineUsers(userList);
            });
        }

        return () => {
            setSocket(null);
        }
    },[]);
    
    function sendMessage (e:FormEvent) {
        e.preventDefault();
        if (currentInput.length < 2) return;
        if (!username || !receiver) {
            console.log(username, receiver);
            return;
        }
        const msg:Message={sender:username,receiver,text:currentInput,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
        socket.emit('sendMessage', msg);
        console.log({sender:username,receiver,msg:currentInput});
        setMessages((prev:Message[])=>[...prev,msg]);
        setCurrentInput("");
    };

    return (
        <main className="chat-container">
            <button onClick={()=>{ setSidebar(sidebar == "" ? "hide": "") }} className="three-line">🟰</button>
            <div className={`chat-sidebar h-full ${sidebar}`}>
                <div className="user-container p-3 rounded-xl">
                    <div>
                        <Link to="/chat"><h2 className="user-heading font-semibold">{username}</h2></Link>
                    </div>
                    <Link to='/logout'><button className="bg-green-800 w-full mt-2 rounded">Logout</button></Link>
                    {onlineUsers.length === 0 && (
                        <p className="text-center mt-5 text-gray-500">Users not Available.</p>
                    )}
                    {onlineUsers.map((user) => {
                        if(user==username) return;
                        return (
                            <div className="user-card" key={user}>
                                <Link to={`/chat/${user}`}>{user}</Link>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className='chat-box'>
                <h1 className={`text-4xl p-2 text-center bg-zinc-900 font-semibold ${receiver?"":"hidden"}`}>{receiver} - {username}</h1>
                <div className="chat-messages">
                    {receiver && messages.map((data:Message)=>{
                        if(data.sender!=receiver && data.receiver!=receiver) return;
                        return (
                        <div className={`message ${data.sender == username ? "outgoing": "incoming"}`} key={Math.random()*99999}>
                            <p className="text">{data.text}</p>
                            <p className="meta">{data.time}</p>
                        </div>)
                    })}
                </div>
                <div className="chat-form-container">
                    <form id="chat-form" className="flex" onSubmit={(e)=>{sendMessage(e)}}>
                        <input className="" id="msg-input" type="text" placeholder="Enter Message" value={currentInput} onChange={(e)=>{setCurrentInput(e.target.value)}} autoComplete="off" disabled={receiver?false:true}/>
                        <button className="send-btn" type="submit" disabled={receiver?false:true}>Send</button>
                    </form>
                </div>
            </div>
        </main>
    )
}

export default Chat