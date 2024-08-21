import React from 'react'
import { Card, CardContent, Typography } from '@mui/material'

function PricingCard({ number, text }) {
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
                        textAlign: "center"
                    }}
                >
                    {number}
                </Typography>
                <Typography
                    sx={{
                        marginLeft: "20px",
                        textAlign: "center"
                    }}
                >
                    {text}
                </Typography>
            </CardContent>
        </Card>
    )
}

export default PricingCard