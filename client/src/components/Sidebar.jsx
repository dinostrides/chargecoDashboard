import React from 'react'
import { useState } from 'react';
import { Box, Button, Stack, Typography, useMediaQuery, useTheme, Modal } from "@mui/material";
import strides from "../assets/stridesnobg.png";
import { useNavigate } from "react-router-dom";
import { IoHomeSharp } from "react-icons/io5";
import { BsBarChartFill } from "react-icons/bs";
import { BsFillEvStationFill } from "react-icons/bs";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { FaUserFriends } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 10,
    borderRadius: '20px',
    p: 4,
};

function Sidebar({ tab }) {
    const [open, setOpen] = useState(false)
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const theme = useTheme();
    const isBelowBreakpoint = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/");
    };

    return (
        <Box sx={{
            zIndex: '1300',
            position: 'fixed',
            left: '0',
            right: '0',
            height: '100%',
            width: '15%',
            maxWidth: '250px',
            minWidth: '120px',
            backgroundColor: '#38495b',
            color: 'white',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box flex={'15%'} sx={{
            }}>
                <img
                    src={strides}
                    alt="Strides Logo"
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                />
            </Box>
            <Box flex={'75%'} sx={{
            }}>
                <Stack spacing={0}>
                    <Button
                        variant="contained"
                        sx={{
                            width: "100%",
                            height: '70px',
                            backgroundColor: tab === "Overview" ? "#30404f" : "#38495b",
                            color: tab == "Overview" ? "white" : "black",
                            boxShadow: "none",
                            "&:hover": {
                                backgroundColor: "#30404f",
                            },
                            textTransform: 'none',
                            marginTop: '50px',
                            borderRadius: '0px',
                        }}
                        onClick={() => {
                            navigate("/overview");
                        }}
                    >
                        <Stack direction={"row"} spacing={2} alignItems={'center'} justifyContent={'flex-start'}>
                            <IoHomeSharp color="white" size={20} />
                            {!isBelowBreakpoint && (
                                <Typography sx={{
                                    fontWeight: '500',
                                    fontSize: '20px',
                                    color: 'white',
                                    fontFamily: "Roboto Condensed",
                                    minWidth: '80px',
                                    textAlign: 'left'
                                }}>
                                    Overview
                                </Typography>
                            )}
                        </Stack>
                    </Button>
                    <Button
                        variant="contained"
                        sx={{
                            width: "100%",
                            height: '70px',
                            backgroundColor: tab === "Utilisation" ? "#30404f" : "#38495b",
                            color: tab == "Utilisation" ? "white" : "black",
                            boxShadow: "none",
                            "&:hover": {
                                backgroundColor: "#30404f",
                            },
                            borderRadius: '0px',
                            textTransform: 'none'
                        }}
                        onClick={() => {
                            navigate("/utilisation");
                        }}
                    >
                        <Stack direction={"row"} spacing={2} alignItems={'center'} justifyContent={'flex-start'}>
                            <BsBarChartFill color="white" size={20} />
                            {!isBelowBreakpoint && (
                                <Typography sx={{
                                    fontWeight: '500',
                                    fontSize: '20px',
                                    color: 'white',
                                    fontFamily: "Roboto Condensed",
                                    minWidth: '80px',
                                    textAlign: 'left'
                                }}>
                                    Utilisation
                                </Typography>
                            )}
                        </Stack>
                    </Button>
                    <Button
                        variant="contained"
                        sx={{
                            width: "100%",
                            height: '70px',
                            backgroundColor: tab === "ByStation" ? "#30404f" : "#38495b",
                            color: tab == "ByStation" ? "white" : "black",
                            boxShadow: "none",
                            "&:hover": {
                                backgroundColor: "#30404f",
                            },
                            textTransform: 'none',
                            borderRadius: '0px',
                        }}
                        onClick={() => {
                            navigate("/bystation");
                        }}
                    >
                        <Stack direction={"row"} spacing={2} alignItems={'center'} justifyContent={'flex-start'}>
                            <BsFillEvStationFill color="white" size={20} />
                            {!isBelowBreakpoint && (
                                <Typography sx={{
                                    fontWeight: '500',
                                    fontSize: '20px',
                                    color: 'white',
                                    fontFamily: "Roboto Condensed",
                                    minWidth: '80px',
                                    textAlign: 'left'
                                }}>
                                    By Station
                                </Typography>
                            )}
                        </Stack>
                    </Button>
                    <Button
                        variant="contained"
                        sx={{
                            width: "100%",
                            height: '70px',
                            backgroundColor: tab === "Billing" ? "#30404f" : "#38495b",
                            color: tab == "Billing" ? "white" : "black",
                            boxShadow: "none",
                            "&:hover": {
                                backgroundColor: "#30404f",
                            },
                            textTransform: 'none',
                            borderRadius: '0px',
                        }}
                        onClick={() => {
                            navigate("/billing");
                        }}
                    >
                        <Stack direction={"row"} spacing={2} alignItems={'center'} justifyContent={'flex-start'}>
                            <FaMoneyCheckAlt color="white" size={20} />
                            {!isBelowBreakpoint && (
                                <Typography sx={{
                                    fontWeight: '500',
                                    fontSize: '20px',
                                    color: 'white',
                                    fontFamily: "Roboto Condensed",
                                    minWidth: '80px',
                                    textAlign: 'left'
                                }}>
                                    Billing
                                </Typography>
                            )}
                        </Stack>
                    </Button>
                    <Button
                        variant="contained"
                        sx={{
                            width: "100%",
                            height: '70px',
                            backgroundColor: tab === "Pricing" ? "#30404f" : "#38495b",
                            color: tab == "Pricing" ? "white" : "black",
                            boxShadow: "none",
                            "&:hover": {
                                backgroundColor: "#30404f",
                            },
                            textTransform: 'none',
                            borderRadius: '0px',
                        }}
                        onClick={() => {
                            navigate("/pricing");
                        }}
                    >
                        <Stack direction={"row"} spacing={2} alignItems={'center'} justifyContent={'flex-start'}>
                            <FaMoneyCheckAlt color="white" size={20} />
                            {!isBelowBreakpoint && (
                                <Typography sx={{
                                    fontWeight: '500',
                                    fontSize: '20px',
                                    color: 'white',
                                    fontFamily: "Roboto Condensed",
                                    minWidth: '80px',
                                    textAlign: 'left'
                                }}>
                                    Pricing
                                </Typography>
                            )}
                        </Stack>
                    </Button>
                    <Button
                        variant="contained"
                        sx={{
                            width: "100%",
                            height: '70px',
                            backgroundColor: tab === "Users" ? "#30404f" : "#38495b",
                            color: tab == "Users" ? "white" : "black",
                            boxShadow: "none",
                            "&:hover": {
                                backgroundColor: "#30404f",
                            },
                            textTransform: 'none',
                            borderRadius: '0px',
                        }}
                        onClick={() => {
                            navigate("/users");
                        }}
                    >
                        <Stack direction={"row"} spacing={2} alignItems={'center'} justifyContent={'flex-start'}>
                            <FaUserFriends color="white" size={20} />
                            {!isBelowBreakpoint && (
                                <Typography sx={{
                                    fontWeight: '500',
                                    fontSize: '20px',
                                    color: 'white',
                                    fontFamily: "Roboto Condensed",
                                    minWidth: '80px',
                                    textAlign: 'left'
                                }}>
                                    Users
                                </Typography>
                            )}
                        </Stack>
                    </Button>
                </Stack>
            </Box>
            <Box flex={'10%'} sx={{
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Button
                    variant="contained"
                    sx={{
                        height: '50%',
                        maxHeight: '40px',
                        width: '50%',
                        borderRadius: "15px",
                        backgroundColor: "#e82e37",
                        "&:hover": {
                            backgroundColor: "#f7404a",
                        },
                        textTransform: 'none',
                    }}
                    onClick={handleOpen}
                >
                    {isBelowBreakpoint ? (
                        <IoLogOut size={20} />
                    ) : (
                        <Typography sx={{
                            fontWeight: '500',
                            fontSize: '15px'
                        }}>Logout</Typography>
                    )}
                </Button>
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2" sx={{
                            textAlign: 'center'
                        }}>
                            Are you sure you want to log out?
                        </Typography>
                        <Stack
                            direction="row"
                            spacing={5}
                            marginTop="20px"
                            justifyContent="center" // This centers the buttons horizontally
                        >
                            <Button
                                variant="contained"
                                onClick={handleLogout}
                                sx={{
                                    backgroundColor: "#e82e37",
                                    "&:hover": {
                                        backgroundColor: "#f7404a",
                                    },
                                    width: '30%'
                                }}
                            >
                                Log out
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleClose}
                                sx={{
                                    width: '30%'
                                }}
                            >
                                Back
                            </Button>
                        </Stack>
                    </Box>
                </Modal>
            </Box>
        </Box>
    )
}

export default Sidebar