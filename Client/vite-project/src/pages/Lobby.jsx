import React, { useCallback, useState, useEffect } from 'react'
import { useSocket } from '../context/SocketProvider'
import { useNavigate } from 'react-router-dom'

const Lobby = () => {
    const [email, setEmail] = useState("")
    const [room, setRoom] = useState("")

    const socket  = useSocket();
    const navigate = useNavigate();

    const handleSubmitForm = useCallback((e) => {
        e.preventDefault();
        socket.emit('room:join', {email,room})
    }, [email, room, socket])

    const handleJoinRoom = useCallback((data)=>{
        const {email , room} = data;
        navigate(`/room/${room}`);
    },[navigate])

    useEffect(() => {
        socket.on('room:join', handleJoinRoom)
        return ()=>{
            socket.off('room:join',handleJoinRoom);
        }
}, [socket, handleJoinRoom])
    

    return (
        <div className='h-screen text-center py-4'>
            <h1 className='text-4xl font-bold'>Lobby</h1>
            <form action="" className='mt-10' onSubmit={handleSubmitForm}>
                <label htmlFor="email">Email</label>
                <input type="email"
                    id='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='border-2 border-black rounded-md mx-4' />
                <br />
                <br />
                <label htmlFor="room">Room No</label>
                <input type="text"
                    id='room'
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className='border-2 border-black rounded-md mx-4' />
                <br />
                <br />
                <button className=''>Join</button>
            </form>
        </div>
    )
}

export default Lobby
