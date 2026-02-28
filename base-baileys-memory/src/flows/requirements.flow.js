const { addKeyword } = require('@bot-whatsapp/bot')
const flows = require('../services/flows')
const ai = require('../services/ai')
const flowFillDocument = require('./fill-document.flow')
const fs = require('fs')
const path = require('path')

const getMsg = (fileName) => fs.readFileSync(path.join(__dirname, '..', '..', 'mensagens', 'es', fileName), 'utf8')

/**
 * Flujo de Requisitos (Mago Interactivo)
 */
const flowWizard = addKeyword(['requisitos', 'necesito', 'ayuda', 'mago'])
    .addAction(async (ctx, { state }) => {
        console.log('[FLOW WIZARD] Iniciando mago de requisitos, nodo "start".')
        // Inicializamos el nodo 'start' del mago
        await state.update({ currentNode: 'start' })
    })
    .addAnswer(
        getMsg('requisitos-intro.txt') + '\n\nSelecciona una opción (1-5) o escribe "inicio":', 
        { capture: true }, 
        async (ctx, { flowDynamic, state, fallBack, gotoFlow }) => {
        if (ctx.body.toLowerCase() === 'inicio') return
        if (ctx.body.toLowerCase() === 'si' || ctx.body.toLowerCase() === 'sí') return gotoFlow(flowFillDocument)
        
        const currentState = state.get('currentNode') || 'start'
        const node = flows.getNode(currentState)
        
        if (node.options) {
            const index = parseInt(ctx.body) - 1
            if (isNaN(index) || index < 0 || index >= node.options.length) {
                // FALLBACK INTELIGENTE: Si no es un número, preguntamos a la IA con el contexto actual
                const node = flows.getNode(currentState)
                const extraContext = `El usuario está en el paso de requisitos: "${node.text}". El usuario NO eligió una opción numérica, sino que preguntó: "${ctx.body}". Responde a su duda brevemente y recuérdale que debe elegir una opción para continuar.`
                const response = await ai.chat(ctx.body, [], extraContext)
                await flowDynamic(response)
                return fallBack()
            }
            const nextNodeId = node.options[index].next
            const nextNode = flows.getNode(nextNodeId)
            await state.update({ currentNode: nextNodeId })
            await flowDynamic(flows.formatNode(nextNode))
            
            if (nextNode.options) {
                return fallBack()
            } else {
                 return checkLeafNode(nextNodeId, nextNode, gotoFlow, fallBack, flowDynamic)
            }
        } else if (node.next && node.next !== 'start') {
            const nextNodeId = node.next
            const nextNode = flows.getNode(nextNodeId)
            await state.update({ currentNode: nextNodeId })
            await flowDynamic(flows.formatNode(nextNode))
            
            if (nextNode.options || nextNode.next) {
                 return fallBack()
            } else {
                 return checkLeafNode(nextNodeId, nextNode, gotoFlow, fallBack, flowDynamic)
            }
        }
    })

// Helper para comprobar si un nodo final requiere el formulario de autorización
async function checkLeafNode(nodeId, node, gotoFlow, fallBack, flowDynamic) {
    const textToLower = (node.text + (node.info ? node.info.join(' ') : '')).toLowerCase()
    
    // Si el nodo menciona "autorización" o es el final de un flujo de representación/no titular
    if (textToLower.includes('autorización') || textToLower.includes('autorizacion') || nodeId.includes('autorizacion') || nodeId.includes('representacion')) {
        await flowDynamic('✨ *¡Hemos terminado de revisar los requisitos!*\n\nSi necesitas el **Formulario de Autorización**, te puedo ayudar a rellenarlo paso a paso.\n\n¿Quieres que te guíe para dejarlo listo para firmar?\n\nResponde *SI* para rellenarlo ahora, o escribe *inicio* para volver al menú.')
        // Necesitamos atrapar la siguiente respuesta. Como la captura principal no maneja "SI", 
        // lo mejor es redirigir a un pequeño sub-flujo recolector o interceptarlo.
        // Para simplificar, si dicen "si", los mandamos directo al flowFillDocument.
        // Esta captura se maneja en el mismo addAnswer añadiendo lógica para el 'SI' al principio de la función principal.
        return fallBack()
    }
}

module.exports = flowWizard
