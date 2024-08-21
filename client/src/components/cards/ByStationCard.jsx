import React from 'react'
import { Card, CardContent, Typography } from '@mui/material'
function ByStationCard({ number, text }) {
    return (
        <Card
            sx={{
                height: {
                    xs: '100px',
                    sm: '100px',
                    md: '100px',
                    lg: '120px',
                    xl: '120px'
                },
                overflow: "hidden",
                bgcolor: "white",
                borderRadius: "20px",
                color: "black",
                boxShadow: 4
            }}
        >
            <CardContent>
                <Typography
                    sx={{
                        fontWeight: "1000",
                        fontSize: "25px",
                        textAlign: {
                            xs: "center",
                            sm: "center", // Center the text on xs screens
                            md: "center", // Default alignment on larger screens
                            lg: "left"
                        },
                    }}
                >
                    {number}
                </Typography>
                <Typography
                    sx={{
                        marginLeft: "20px",
                        textAlign: {
                            xs: "center",
                            sm: "center", // Center the text on xs screens
                            md: "center", // Default alignment on larger screens
                            lg: "left"
                        },
                    }}
                >
                    {text}
                </Typography>
            </CardContent>
        </Card>
    )
}

export default ByStationCard