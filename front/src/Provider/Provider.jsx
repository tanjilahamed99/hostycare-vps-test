/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import setAuthToken from "../config/setAuthToken";
import { BASE_URL } from "../config/constant";
import socket from "../utils/soket";
import Swal from "sweetalert2";
import myData from "../hooks/users/myData";
import updateUser from "../hooks/users/updateUser";

const CallContext = createContext();

export const Provider = ({ children }) => {
  const navigate = useNavigate();
  // Global states
  const [incomingCall, setIncomingCall] = useState(null);
  const [user, setUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myInfo, setMyInfo] = useState(null);
  const [isRoomClosed, setIsRoomClosed] = useState(false);

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser({});
    Swal.fire({
      title: "Successful",
      text: "You have logged out!",
      icon: "success",
    });
    navigate("/login");
  };

  // ✅ INIT LOGIC (moved from your init.js)
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      document.addEventListener("gesturestart", (e) => {
        e.preventDefault();
      });

      // Version check
      if (localStorage.getItem("app") !== "CallBell 2.x.x") {
        localStorage.clear();
        localStorage.setItem("app", "CallBell 2.x.x");
      }

      let token = localStorage.getItem("token");
      let userString = localStorage.getItem("user");
      let user = userString ? JSON.parse(userString) : null;

      if (token) {
        const decoded = jwtDecode(token, { complete: true });
        const dateNow = new Date();
        const isExpired = decoded.exp * 1000 < dateNow.getTime();

        let result;
        if (!isExpired) {
          try {
            const res = await axios.post(`${BASE_URL}/auth/check-user`, {
              id: decoded.id,
            });
            result = res.data;
          } catch (err) {
            console.log(err);
            result = null;
          }
        }

        if (!result || result.error) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          token = null;
          user = null;
        }
      }

      if (token) {
        setAuthToken(token);
      }

      // Push values into global state
      setToken(token);
      setUser(user);
      setLoading(false);
    };

    init();
  }, []);

  // ✅ SOCKET HANDLING
  useEffect(() => {
    socket.on("connection", () => {
      console.log("✅ Socket connected");
    });

    if (user) {
      socket.emit("register", user.id);
    }
    if (!user) {
      socket.emit("register", localStorage.getItem("guestName"));
    }
    socket.on("incoming-call", ({ from, roomName }) => {
      setIncomingCall({ from, roomName });
      setModalOpen(true);
    });

    if (user) {
      socket.on("call-accepted", ({ roomName, peerSocketId }) => {
        navigate(
          `/room?roomName=${roomName}&username=${user.name}&peerSocketId=${peerSocketId}`
        );
      });
    }

    socket.on("end-call", () => {
      if (user) {
        const callStart = Number(localStorage.getItem("callStart"));
        if (!callStart) {
          return navigate("/");
        }
        const totalSeconds = Math.floor((Date.now() - callStart) / 1000);
        const totalMinutes = totalSeconds / 60;
        if (totalMinutes <= 0) {
          return navigate("/"); // redirect back to home (or show a modal)
        }
        let newBalance = myInfo.subscription.minute - totalMinutes;
        if (newBalance < 0) {
          newBalance = 0;
        }
        const dataa = {
          "subscription.minute": newBalance,
        };
        const fetch = async () => {
          const { data } = await updateUser({ id: user.id, data: dataa });
          if (data.success) {
            localStorage.removeItem("callStart");
          }
        };
        fetch();
      }
      navigate("/");
    });

    socket.on("callCanceled", (data) => {
      if (data.success) {
        setModalOpen(false);
        setIncomingCall(null);
      }
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("call-declined");
      socket.off("end-call");
      socket.off("callCanceled");
    };
  }, [user, navigate, myInfo]);

  useEffect(() => {
    if (user?.id) {
      const fetch = async () => {
        const { data } = await myData({ id: user?.id });
        if (data.success) {
          setMyInfo(data.data);
        }
      };
      fetch();
    }
  }, [token, user]);

  // ✅ Helper functions
  const declineCall = useCallback(() => {
    if (!incomingCall) return;
    socket.emit("call-declined", { guestSocketId: incomingCall.from.socketId });
    setModalOpen(false);
    setIncomingCall(null);
  }, [incomingCall]);

  const getRemainingDays = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;

    if (
      myInfo?.subscription?.minute <= 0 ||
      getRemainingDays(myInfo?.subscription?.endDate) <= 0
    ) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Plan expired or minutes exhausted",
      });
      return;
    }

    socket.emit("call-accepted", {
      roomName: incomingCall.roomName,
      guestSocketId: incomingCall.from.socketId,
    });
    setModalOpen(false);
    // when call starts
    const startTime = Date.now(); // milliseconds
    localStorage.setItem("callStart", startTime);
    navigate(
      `/room?roomName=${incomingCall.roomName}&username=${user.name}&peerSocketId=${incomingCall.from.socketId}`
    );
  }, [incomingCall, navigate, user, myInfo]);

  // ✅ Helper functions
  const handleEndCall = useCallback(
    (peerSocketId) => {
      if (user) {
        const callStart = Number(localStorage.getItem("callStart"));
        if (!callStart) {
          return navigate("/");
        }
        const totalSeconds = Math.floor((Date.now() - callStart) / 1000);
        const totalMinutes = totalSeconds / 60;
        if (totalMinutes <= 0) {
          return navigate("/"); // redirect back to home (or show a modal)
        }
        let newBalance = myInfo.subscription.minute - totalMinutes;
        if (newBalance < 0) {
          newBalance = 0;
        }
        const dataa = {
          "subscription.minute": newBalance,
        };
        const fetch = async () => {
          await updateUser({ id: user.id, data: dataa });
        };
        fetch();
        socket.emit("end-call", {
          targetSocketId: incomingCall.from.gestSocketId,
        });
      } else {
        socket.emit("end-call", { targetSocketId: peerSocketId });
      }
      localStorage.removeItem("callStart");
      navigate("/");
    },
    [navigate]
  );

  // ✅ Data available everywhere
  const data = {
    handleEndCall,
    incomingCall,
    declineCall,
    acceptCall,
    modalOpen,
    user,
    setUser,
    token,
    setToken,
    logout,
    loading,
    isRoomClosed,
    setIsRoomClosed,
  };

  return <CallContext.Provider value={data}>{children}</CallContext.Provider>;
};

export const useCall = () => useContext(CallContext);
