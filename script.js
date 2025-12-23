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
@group(0) @binding(0) var<uniform> mvp: mat4x4<f32>;

@vertex
fn vertexMain(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
    return mvp * vec4<f32>(position, 1.0);
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
    size: 4 * 3 * 4, // 4 vertices, 3 floats per vertex, 4 bytes per float
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const uniformBuffer = device.createBuffer({
    size: 16 * 4, // 16 floats for mat4
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const bindGroupLayout = device.createBindGroupLayout({
    entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'uniform' },
    }],
});

const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{
        binding: 0,
        resource: { buffer: uniformBuffer },
    }],
});

const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
    }),
    vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
            arrayStride: 12, // 3 floats * 4 bytes
            attributes: [{
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
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
    depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
    },
});

const depthTexture = device.createTexture({
    size: [800, 600],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

function createMVPMatrix(rotationY = 0) {
    const aspect = 800 / 600;
    const fov = Math.PI / 4;
    const near = 0.1;
    const far = 100;
    const f = 1 / Math.tan(fov / 2);
    const rangeInv = 1 / (near - far);

    // Projection
    const proj = [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ];

    // View (camera at (0,0,5) looking at (0,0,0))
    const view = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, -5, 1
    ];

    // Model (rotation around Y)
    const cos = Math.cos(rotationY);
    const sin = Math.sin(rotationY);
    const model = [
        cos, 0, sin, 0,
        0, 1, 0, 0,
        -sin, 0, cos, 0,
        0, 0, 0, 1
    ];

    // MVP = proj * view * model
    const mvp = multiplyMatrices(multiplyMatrices(proj, view), model);
    return mvp;
}

function multiplyMatrices(a, b) {
    const result = new Array(16).fill(0);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
            }
        }
    }
    return result;
}

function render(rotationY = 0) {
    const mvp = createMVPMatrix(rotationY);
    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array(mvp));

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    });
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
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
            -1, 0, -1,
            1, 0, -1,
            -1, 0, 1,
            1, 0, 1
        ]);
    } else {
        vertices = new Float32Array([
            -2, 0, -1,
            2, 0, -1,
            -2, 0, 1,
            2, 0, 1
        ]);
    }
    device.queue.writeBuffer(vertexBuffer, 0, vertices);
    const rotationY = Math.random() * Math.PI * 2;
    render(rotationY);
}

document.getElementById('generateBtn').addEventListener('click', generateIsland);

// Initial Insel
render(0);
