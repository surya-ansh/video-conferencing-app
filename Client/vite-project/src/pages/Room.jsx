import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/SocketProvider'
import ReactPlayer from 'react-player';
import peer from '../services/peer';

const Room = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream, setMyStream] = useState()
    const [remoteStream, setRemoteStream] = useState()



    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`Email ${email} joined room`)
        setRemoteSocketId(id)
    }, [])

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia(
            {
                audio: true,
                video: true
            });
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer })
        setMyStream(stream)
    }, [remoteSocketId, socket])

    const handleIncomingCall = useCallback(
        async ({ from, offer }) => {
            setRemoteSocketId(from)
            const stream = await navigator.mediaDevices.getUserMedia(
                {
                    audio: true,
                    video: true
                });
            setMyStream(stream)
            console.log(`Incoming call from`, from, offer)
            const ans = await peer.getAnswer(offer);
            socket.emit('call:accepted', { to: from, ans })
        }, [socket]);

    const sendStreams = useCallback(() => {
        console.log("sendstream successfully")
        const existingSenders = peer.peer.getSenders();
        for (const track of myStream.getTracks()) {
            const senderExists = existingSenders.some(sender => sender.track === track);
            if (!senderExists) {
                peer.peer.addTrack(track, myStream);
            }
        }
    }, [myStream]);

    const handleCallAccepted = useCallback(
        ({ from, ans }) => {
            peer.setLocalDescription(ans);
            console.log('call Accepted');
            sendStreams();
        }, [sendStreams])

    const handleNegoNeeded = useCallback(() => {
        async () => {
            const offer = await peer.getOffer();
            socket.emit("peer:nego:needed", { offer, to: remoteSocketId })
        }
    }, [remoteSocketId, socket])

  
    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', handleNegoNeeded)
        return () => {
            peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded)
        }
    }, [handleNegoNeeded])

    const handleNegoNeedIncoming = useCallback(
        async ({ from, offer }) => {
            const ans = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans });
        },
        [socket]
    );


    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans);
    }, []);



    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
            const remoteStream = ev.streams;
            console.log("GOT TRACKS!!!");
            setRemoteStream(remoteStream[0])
        })
    }, [])


    useEffect(() => {
        socket.on('user:joined', handleUserJoined)
        socket.on("incoming:call", handleIncomingCall)
        socket.on("call:accepted", handleCallAccepted)
        socket.on("peer:nego:needed", handleNegoNeedIncoming);
        socket.on("peer:nego:final", handleNegoNeedFinal);

        return () => {
            socket.off('user:joined', handleUserJoined)
            socket.off("incoming:call", handleIncomingCall)
            socket.off("call:accepted", handleCallAccepted)
            socket.off("peer:nego:needed", handleNegoNeedIncoming);
            socket.off("peer:nego:final", handleNegoNeedFinal);
        }
    }, [
        socket,
        handleUserJoined,
        handleIncomingCall,
        handleCallAccepted,
        handleNegoNeedIncoming,
        handleNegoNeedFinal,
    ])

    return (
        <div className='h-screen text-center py-4'>
            <h1 className='text-4xl font-bold'>This is my room page</h1>
            <h4 className='text-3xl font-bold mt-4'>{remoteSocketId ? "connected" : "No one is in room"}</h4>
            {myStream && <button onClick={sendStreams} className='mx-4'>Send Stream</button>}
            {remoteSocketId && <button onClick={handleCallUser} className='mt-4'>Call</button>}
            {
                myStream &&
                <div className=' w-1/2 flex flex-col items-center mx-4 my-4'>
                    <h1 className='text-3xl font-bold'>My Stream</h1>
                    <ReactPlayer playing muted height="450px" width="600px" url={myStream} />
                </div>
            }
            {
                remoteStream &&
                <div className=' w-1/2 flex flex-col items-center mx-4 my-4'>
                    <h1 className='text-3xl font-bold'>Remote Stream</h1>
                    <ReactPlayer playing muted height="450px" width="600px" url={remoteStream} />
                </div>
            }
        </div>
    )
}

export default Room
