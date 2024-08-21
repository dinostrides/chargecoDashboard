import React from 'react'
import { Box, Stack, Typography } from '@mui/material'

function Legend() {
    return (
        <Box sx={{
            width: '100%',
            height: '100px',
            marginTop: '20px',
            padding: '10px',
            boxSizing: 'border-box'
        }}>
            <Stack direction={'row'} spacing={2}>
                <Box sx={{
                    width: '15px',
                    height: '15px',
                    backgroundColor: 'green'
                }}></Box>
                <Typography sx={{
                    fontSize: '13px'
                }}>In operation</Typography>
            </Stack>
            <Stack direction={'row'} spacing={2}>
                <Box sx={{
                    width: '15px',
                    height: '15px',
                    backgroundColor: 'red'
                }}></Box>
                <Typography sx={{
                    fontSize: '13px'
                }}>No charging points</Typography>
            </Stack>
            <Stack direction={'row'} spacing={2}>
                <Box sx={{
                    width: '15px',
                    height: '15px',
                    backgroundColor: 'orange'
                }}></Box>
                <Typography sx={{
                    fontSize: '13px'
                }}>Coming soon</Typography>
            </Stack>
        </Box>
    )
}

export default Legend