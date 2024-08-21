import React from 'react'
import { Card, CardContent, Typography } from '@mui/material'

function UtilisationCard({ number, text }) {
    return (
        <Card
            sx={{
                height: "100px",
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
                            md: "left", // Default alignment on larger screens
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
                            md: "left", // Default alignment on larger screens
                        },
                    }}
                >
                    {text}
                </Typography>
            </CardContent>
        </Card>
    )
}

export default UtilisationCard