const canvas = document.getElementById('container');
const context = canvas.getContext('webgpu');
const device = await (async () => {
    if (!navigator.gpu) {
        document.getElementById('rendererInfo').textContent = 'Renderer: WebGL';
        // Fallback to WebGL if needed, but for simplicity, throw error
        throw new Error('WebGPU not supported');
    }
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    document.getElementById('rendererInfo').textContent = 'Renderer: WebGPU';
    return device;
})();

context.configure({
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied',
});

const vertexShaderCode = `
@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    var positions = array<vec2<f32>, 4>(
        vec2<f32>(-0.5, -0.5),
        vec2<f32>(0.5, -0.5),
        vec2<f32>(-0.5, 0.5),
        vec2<f32>(0.5, 0.5)
    );
    return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}
`;

const fragmentShaderCode = `
@fragment
fn main() -> @location(0) vec4<f32> {
    return vec4<f32>(0.0, 1.0, 0.0, 1.0); // Grün für Insel
}
`;

const shaderModule = device.createShaderModule({
    code: vertexShaderCode + fragmentShaderCode,
});

const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
        module: shaderModule,
        entryPoint: 'main',
    },
    fragment: {
        module: shaderModule,
        entryPoint: 'main',
        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
    },
    primitive: {
        topology: 'triangle-strip',
    },
});

function render() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
        }],
    });
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(4);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
}

document.getElementById('generateBtn').addEventListener('click', () => {
    // Für zufällige Insel, ändere die Positionen oder Farbe hier
    render();
});

render(); // Initial render
