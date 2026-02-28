const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { fillAutorizacion } = require('../services/pdf-fill')
const fs = require('fs')

// Cargar códigos postales de Madrid
const oficinasMadrid = require('../../../200149-2-oficinas-linea-madrid.json')
const validMadridPostalCodes = Array.isArray(oficinasMadrid) 
    ? oficinasMadrid.map(o => o['CODIGO-POSTAL']).filter(Boolean)
    : (oficinasMadrid['@graph'] ? oficinasMadrid['@graph'].map(o => o['CODIGO-POSTAL']).filter(Boolean) : [])

/**
 * Flujo para rellenar interactivamente el documento de autorización
 */
const flowFillDocument = addKeyword(EVENTS.ACTION)
    .addAnswer(
        '✍️ *Asistente de llenado de Autorización*\n\nVamos a preparar tu documento paso a paso. Si en algún momento quieres salir, escribe *cancelar*.\n\nPara empezar, dime el *Nombre* de la persona que autoriza (el titular):',
        { capture: true },
        async (ctx, { state, endFlow }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Llenado de documento cancelado. Escribe *inicio* para volver al menú.')
            await state.update({ nombre: ctx.body })
        }
    )
    .addAnswer(
        'Perfecto. Ahora dime los *Apellidos* de la persona que autoriza:',
        { capture: true },
        async (ctx, { state, endFlow }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Cancelado.')
            const apellidos = ctx.body.split(' ')
            await state.update({ 
                primerApellido: apellidos[0] || '', 
                segundoApellido: apellidos.slice(1).join(' ') || '' 
            })
        }
    )
    .addAnswer(
        '¿Cuál es el *DNI, NIE o Pasaporte* de la persona que autoriza?',
        { capture: true },
        async (ctx, { state, endFlow }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Cancelado.')
            const doc = ctx.body.toUpperCase().trim()
            let tipoDoc = 'Pasaporte'
            if (/^[XYZ]\d{7}[A-Z]$/.test(doc) || doc.startsWith('X') || doc.startsWith('Y') || doc.startsWith('Z')) {
                tipoDoc = 'NIE'
            } else if (/^\d{8}[A-Z]$/.test(doc) || /^\d/.test(doc)) {
                tipoDoc = 'DNI'
            }
            await state.update({ numDocumento: doc, tipoDoc })
        }
    )
    .addAnswer(
        'Dime tu *Correo electrónico*:',
        { capture: true },
        async (ctx, { state, endFlow }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Cancelado.')
            await state.update({ email: ctx.body })
        }
    )
    .addAnswer(
        'Dime tu número de *Teléfono Móvil*:',
        { capture: true },
        async (ctx, { state, endFlow }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Cancelado.')
            await state.update({ movil: ctx.body, telefono: ctx.body }) // Asignamos el mismo al teléfono fijo si no lo dieron
        }
    )
    .addAnswer(
        '¿Cuál es el *Tipo de vía* de tu domicilio? (Ejemplo: Calle, Avenida, Plaza, Paseo):',
        { capture: true },
        async (ctx, { state, endFlow }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Cancelado.')
            await state.update({ tipoVia: ctx.body })
        }
    )
    .addAnswer(
        'Dime el *Nombre de la vía* (Domicilio):',
        { capture: true },
        async (ctx, { state, endFlow }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Cancelado.')
            await state.update({ domicilio: ctx.body })
        }
    )
    .addAnswer(
        'Dime el *Número* del domicilio:',
        { capture: true },
        async (ctx, { state, endFlow }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Cancelado.')
            await state.update({ tipoNum: 'NÚMERO', numero: ctx.body })
        }
    )
    .addAnswer(
        '¿Cuál es el *Código Postal*?',
        { capture: true },
        async (ctx, { state, endFlow, fallBack }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Cancelado.')
            const cp = ctx.body.trim()
            if (validMadridPostalCodes.length > 0 && !validMadridPostalCodes.includes(cp)) {
                return fallBack('❌ Ese código postal no parece ser de Madrid capital. Solo podemos gestionar trámites para el municipio de Madrid. Por favor, introduce un código postal de Madrid válido (o escribe *cancelar*):')
            }
            await state.update({ cp, municipio: 'MADRID' })
        }
    )
    .addAnswer(
        '📥 *Datos de la persona Autorizada*\n\nDime el *Nombre* de la persona que va a ir presencialmente a realizar el trámite en tu nombre:',
        { capture: true },
        async (ctx, { state, endFlow }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Cancelado.')
            await state.update({ nombre2: ctx.body })
        }
    )
    .addAnswer(
        'Dime los *Apellidos* de la persona autorizada:',
        { capture: true },
        async (ctx, { state, endFlow }) => {
            if (ctx.body.toLowerCase() === 'cancelar') return endFlow('❌ Cancelado.')
            const apellidos = ctx.body.split(' ')
            await state.update({ 
                primerApellido2: apellidos[0] || '', 
                segundoApellido2: apellidos.slice(1).join(' ') || '' 
            })
        }
    )
    .addAnswer(
        'Por último, dime el *DNI o NIE* de la persona autorizada:',
        { capture: true, delay: 1000 },
        async (ctx, { state, flowDynamic }) => {
            if (ctx.body.toLowerCase() === 'cancelar') {
                await flowDynamic('❌ Cancelado. Escribe *inicio* para volver al menú.')
                return
            }
            
            await state.update({ 
                numDocumento2: ctx.body.toUpperCase(),
                tipoDoc2: ctx.body.toUpperCase().startsWith('X') || ctx.body.toUpperCase().startsWith('Y') || ctx.body.toUpperCase().startsWith('Z') ? 'NIE' : 'DNI',
                // Valores por defecto para la fecha de hoy
                lugar: 'Madrid',
                dia: new Date().getDate().toString(),
                mes: new Date().toLocaleString('es-ES', { month: 'long' }),
                anio: new Date().getFullYear().toString().slice(-2)
            })

            await flowDynamic('⚙️ *Generando tu documento...* Esto tomará un par de segundos.')
            
            try {
                const misDatos = state.getMyState()
                console.log('[FILL-DOC] Rellenando PDF con:', misDatos)
                const outputPath = await fillAutorizacion(misDatos)
                
                await flowDynamic([
                    {
                        body: '✅ ¡Aquí tienes tu Autorización rellenada! Solo falta que la imprimas y la **firmes**.\n\nEscribe *inicio* para volver al menú principal.',
                        media: outputPath
                    }
                ])
                return
                
            } catch (error) {
                console.error('[FILL-DOC] Error:', error)
                await flowDynamic('❌ Hubo un error al generar el PDF. Por favor, intenta de nuevo más tarde.')
                return
            }
        }
    )

module.exports = flowFillDocument
