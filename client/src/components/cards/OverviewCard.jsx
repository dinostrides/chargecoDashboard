import React from 'react'
import { Card, CardContent, Typography } from '@mui/material'

function OverviewCard( {number, text} ) {
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
                            sm: "center",
                            xs: "center",
                            md: "left",
                            lg: "left"
                        }
                    }}
                >
                    {number}
                </Typography>
                <Typography
                    sx={{
                        marginLeft: "20px",
                        textAlign: {
                            sm: "center",
                            xs: "center",
                            md: "left",
                            lg: "left"
                        }
                    }}
                >
                    {text}
                </Typography>
            </CardContent>
        </Card>
    )
}

export default OverviewCard