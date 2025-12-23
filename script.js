const container = document.getElementById('container');
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
container.appendChild(canvas);
const context = canvas.getContext('webgpu');

const device = await (async () => {
    if (!navigator.gpu) {
        document.getElementById('rendererInfo').textContent = 'Renderer: WebGL';
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
fn vertexMain(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
    return vec4<f32>(position, 0.0, 1.0);
}
`;

const fragmentShaderCode = `
@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
    return vec4<f32>(0.0, 1.0, 0.0, 1.0); // Grün für Insel
}
`;

const shaderModule = device.createShaderModule({
    code: vertexShaderCode + fragmentShaderCode,
});

const vertexBuffer = device.createBuffer({
    size: 4 * 2 * 4, // 4 vertices, 2 floats per vertex, 4 bytes per float
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
            arrayStride: 8, // 2 floats * 4 bytes
            attributes: [{
                shaderLocation: 0,
                offset: 0,
                format: 'float32x2',
            }],
        }],
    },
    fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
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
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(4);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
}

function generateIsland() {
    const shape = Math.random() < 0.5 ? 'quadrat' : 'rechteck';
    let vertices;
    if (shape === 'quadrat') {
        vertices = new Float32Array([
            -0.5, -0.5,
            0.5, -0.5,
            -0.5, 0.5,
            0.5, 0.5
        ]);
    } else {
        vertices = new Float32Array([
            -1.0, -0.5,
            1.0, -0.5,
            -1.0, 0.5,
            1.0, 0.5
        ]);
    }
    device.queue.writeBuffer(vertexBuffer, 0, vertices);
    render();
}

document.getElementById('generateBtn').addEventListener('click', generateIsland);

// Initial Insel
generateIsland();
