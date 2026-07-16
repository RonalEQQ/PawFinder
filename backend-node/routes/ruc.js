const express = require('express')
const router = express.Router()

router.get('/:ruc', async (req, res) => {
    const { ruc } = req.params

    if (!/^\d{11}$/.test(ruc)) {
        return res.status(400).json({ error: 'RUC inválido. Debe tener 11 dígitos.' })
    }

    try {
        const token = process.env.APISPERU_TOKEN
        const url = `https://dniruc.apisperu.com/api/v1/ruc/${ruc}?token=${token}`
        const response = await fetch(url)

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Error al consultar APISPerú' })
        }

        const data = await response.json()

        return res.json({
            ruc: data.ruc,
            razonSocial: data.razonSocial,
            estado: data.estado,
            condicion: data.condicion,
            direccion: data.direccion,
            departamento: data.departamento,
            provincia: data.provincia,
            distrito: data.distrito,
        })
    } catch (error) {
        console.error('Error RUC:', error)
        return res.status(500).json({ error: 'Error interno del servidor' })
    }
})

module.exports = router