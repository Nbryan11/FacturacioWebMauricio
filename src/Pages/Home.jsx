import { useState, useEffect } from "react";
import axios from "axios";

const Home = () => {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState("cliente");
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [mostrarFacturas, setMostrarFacturas] = useState(false);
  const [facturaDetalle, setFacturaDetalle] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  // Estado para el formulario de factura
  const [formFactura, setFormFactura] = useState({
    invoiceNumber: `FAC-${Math.floor(Math.random() * 10000)}`,
    userId: "",
    customerId: "",
    date: new Date().toISOString().split("T")[0],
    items: [
      {
        productId: "",
        quantity: 1,
        unitPrice: 0,
        subTotal: 0,
      },
    ],
    total: 0,
  });

  // Estados para otros formularios
  const [formCliente, setFormCliente] = useState({
    Name: "",
    TipoDocumento: "",
    Documento: "",
    Email: "",
    Phone: "",
    Address: "",
  });

  const [formProducto, setFormProducto] = useState({
    Name: "",
    Description: "",
    Price: "",
  });

  // Handlers para factura
  const handleAddItem = () => {
    setFormFactura((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: "",
          quantity: 1,
          unitPrice: 0,
          subTotal: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    if (formFactura.items.length > 1) {
      const newItems = formFactura.items.filter((_, i) => i !== index);
      setFormFactura((prev) => ({
        ...prev,
        items: newItems,
        total: newItems.reduce((sum, item) => sum + item.subTotal, 0),
      }));
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formFactura.items];

    newItems[index] = {
      ...newItems[index],
      [name]: name === "quantity" ? parseInt(value) || 0 : value,
    };

    if (name === "productId") {
      const selectedProduct = productos.find((p) => p.productId == value);
      if (selectedProduct) {
        newItems[index].unitPrice = selectedProduct.price;
        newItems[index].subTotal =
          newItems[index].quantity * selectedProduct.price;
      }
    }

    if (name === "quantity") {
      newItems[index].subTotal =
        newItems[index].quantity * newItems[index].unitPrice;
    }

    const newTotal = newItems.reduce((sum, item) => sum + item.subTotal, 0);

    setFormFactura((prev) => ({
      ...prev,
      items: newItems,
      total: newTotal,
    }));
  };

  const handleFacturaChange = (e) => {
    const { name, value } = e.target;
    setFormFactura((prev) => ({ ...prev, [name]: value }));
  };

  // Handler para enviar factura
  const handleSubmitFactura = async (e) => {
    e.preventDefault();
    try {
      if (!formFactura.customerId) {
        alert("Seleccione un cliente");
        return;
      }

      if (
        formFactura.items.some((item) => !item.productId || item.quantity <= 0)
      ) {
        alert("Todos los productos deben tener una cantidad válida");
        return;
      }

      const itemsWithPrices = await Promise.all(
        formFactura.items.map(async (item) => {
          const producto = productos.find((p) => p.productId == item.productId);
          const unitPrice = producto ? producto.price : 0;
          const subTotal = item.quantity * unitPrice;

          return {
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            unitPrice: unitPrice,
            subTotal: subTotal,
          };
        })
      );

      const total = itemsWithPrices.reduce(
        (sum, item) => sum + item.subTotal,
        0
      );

      const facturaData = {
        InvoiceNumber: `FAC-${Math.floor(Math.random() * 10000)}`,
        UserId: parseInt(formFactura.userId || usuarios[0]?.userId),
        CustomerId: parseInt(formFactura.customerId),
        Date: new Date().toISOString(),
        Total: total,
        InvoiceDetails: itemsWithPrices,
      };

      const response = await axios.post(
        "https://api20250426224207.azurewebsites.net/api/factura",
        facturaData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        alert("Factura creada exitosamente");
        setFormFactura({
          customerId: "",
          items: [
            {
              productId: "",
              quantity: 1,
              unitPrice: 0,
              subTotal: 0,
            },
          ],
          total: 0,
        });
      }
    } catch (error) {
      console.error("Error al crear factura:", {
        message: error.message,
        response: error.response?.data,
        request: error.config?.data,
      });

      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors)
          .flat()
          .join("\n");
        alert(`Errores de validación:\n${errorMessages}`);
      } else {
        alert(`Error: ${error.response?.data?.title || error.message}`);
      }
    }
  };

  // Handlers para cliente y producto
  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "https://api20250426224207.azurewebsites.net/api/customer",
        formCliente
      );
      alert("Cliente registrado exitosamente");
      setFormCliente({ Name: "", Email: "", Phone: "", Address: "" });
      cargarClientes();
    } catch (error) {
      console.error(error);
      alert("Error registrando cliente");
    }
  };

  const handleSubmitProducto = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "https://api20250426224207.azurewebsites.net/api/producto",
        formProducto
      );
      alert("Producto registrado exitosamente");
      setFormProducto({ Name: "", Description: "", Price: "" });
      cargarProductos();
    } catch (error) {
      console.error(error);
      alert("Error registrando producto");
    }
  };

  // Funciones para cargar datos
  const cargarProductos = async () => {
    try {
      const response = await axios.get(
        "https://api20250426224207.azurewebsites.net/api/producto"
      );
      setProductos(response.data);
    } catch (error) {
      console.error(error);
      alert("Error cargando productos");
    }
  };

  const cargarClientes = async () => {
    try {
      const response = await axios.get(
        "https://api20250426224207.azurewebsites.net/api/customer"
      );
      setClientes(response.data);
    } catch (error) {
      console.error(error);
      alert("Error cargando clientes");
    }
  };

  const cargarUsuarios = async () => {
    try {
      const response = await axios.get(
        "https://api20250426224207.azurewebsites.net/api/user"
      );
      setUsuarios(response.data);
      if (response.data.length > 0) {
        setFormFactura((prev) => ({
          ...prev,
          userId: response.data[0].userId,
        }));
      }
    } catch (error) {
      console.error(error);
      alert("Error cargando usuarios");
    }
  };

  const cargarFacturas = async () => {
    try {
      const response = await axios.get(
        "https://api20250426224207.azurewebsites.net/api/factura"
      );
      setFacturas(response.data);
      setMostrarFacturas(true);
      setMostrarDetalle(false);
    } catch (error) {
      console.error("Error cargando facturas:", error);
      alert("Error al cargar facturas");
    }
  };

  const verDetalleFactura = (factura) => {
    setFacturaDetalle(factura);
    setMostrarDetalle(true);
    setMostrarFacturas(false);
  };

  const volverAListado = () => {
    setFacturaDetalle(null);
    setMostrarDetalle(false);
    setMostrarFacturas(true);
  };

  useEffect(() => {
    cargarProductos();
    cargarClientes();
    cargarUsuarios();
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Menú izquierdo */}
      <div
        style={{ width: "20%", backgroundColor: "#f4f4f4", padding: "20px" }}
      >
        <h2>Opciones</h2>
        <button
          onClick={() => {
            setOpcionSeleccionada("cliente");
            setMostrarFacturas(false);
            setMostrarDetalle(false);
          }}
          style={{ marginTop: "10px", width: "100%" }}
        >
          Registrar Cliente
        </button>
        <button
          onClick={() => {
            setOpcionSeleccionada("producto");
            setMostrarFacturas(false);
            setMostrarDetalle(false);
          }}
          style={{ marginTop: "10px", width: "100%" }}
        >
          Añadir Producto
        </button>
        <button
          onClick={() => {
            setOpcionSeleccionada("venta");
            setMostrarFacturas(false);
            setMostrarDetalle(false);
          }}
          style={{ marginTop: "10px", width: "100%" }}
        >
          Generar Factura
        </button>
        <button
          onClick={() => {
            setOpcionSeleccionada("mostrarProductos");
            setMostrarFacturas(false);
            setMostrarDetalle(false);
          }}
          style={{ marginTop: "10px", width: "100%" }}
        >
          Mostrar Productos
        </button>
        <button
          onClick={() => {
            cargarFacturas();
            setOpcionSeleccionada("facturas");
          }}
          style={{ marginTop: "10px", width: "100%" }}
        >
          Ver Facturas
        </button>
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        {/* Formulario de cliente */}
        {opcionSeleccionada === "cliente" && (
          <div style={{ maxWidth: "500px" }}>
            <h1>Registrar Cliente</h1>
            <form
              onSubmit={handleSubmitCliente}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <label>Nombre:</label>
              <input
                type="text"
                name="Name"
                value={formCliente.Name}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, Name: e.target.value })
                }
                required
              />

              <label>Tipo de Documento:</label>
              <select
                name="TipoDocumento"
                value={formCliente.TipoDocumento}
                onChange={(e) =>
                  setFormCliente({
                    ...formCliente,
                    TipoDocumento: e.target.value,
                  })
                }
                required
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="NIT">NIT</option>
              </select>

              <label>Documento:</label>
              <input
                type="text"
                name="Documento"
                value={formCliente.Documento}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, Documento: e.target.value })
                }
                required
              />

              <label>Email:</label>
              <input
                type="email"
                name="Email"
                value={formCliente.Email}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, Email: e.target.value })
                }
                required
              />

              <label>Teléfono:</label>
              <input
                type="text"
                name="Phone"
                value={formCliente.Phone}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, Phone: e.target.value })
                }
                required
              />

              <label>Dirección:</label>
              <input
                type="text"
                name="Address"
                value={formCliente.Address}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, Address: e.target.value })
                }
                required
              />

              <button
                type="submit"
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                Registrar Cliente
              </button>
            </form>
          </div>
        )}

        {/* Formulario de producto */}
        {opcionSeleccionada === "producto" && (
          <div style={{ maxWidth: "500px" }}>
            <h1>Añadir Producto</h1>
            <form
              onSubmit={handleSubmitProducto}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <label>Nombre del Producto:</label>
              <input
                type="text"
                name="Name"
                value={formProducto.Name}
                onChange={(e) =>
                  setFormProducto({ ...formProducto, Name: e.target.value })
                }
                required
              />

              <label>Descripción:</label>
              <textarea
                name="Description"
                value={formProducto.Description}
                onChange={(e) =>
                  setFormProducto({
                    ...formProducto,
                    Description: e.target.value,
                  })
                }
                required
              />

              <label>Precio:</label>
              <input
                type="number"
                step="0.01"
                name="Price"
                value={formProducto.Price}
                onChange={(e) =>
                  setFormProducto({ ...formProducto, Price: e.target.value })
                }
                required
              />

              <button
                type="submit"
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                Añadir Producto
              </button>
            </form>
          </div>
        )}

        {/* Listado de facturas */}
        {opcionSeleccionada === "facturas" && mostrarFacturas && (
          <div style={{ marginTop: "20px" }}>
            <h1>Facturas Registradas</h1>

            <button
              onClick={cargarFacturas}
              style={{
                marginBottom: "20px",
                padding: "8px 15px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Actualizar Listado
            </button>

            {facturas.length === 0 ? (
              <p>No hay facturas registradas.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f4f4f4" }}>
                      <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                        N° Factura
                      </th>
                      <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                        Fecha
                      </th>
                      <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                        Cliente
                      </th>
                      <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                        Total
                      </th>
                      <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                        Registrado por
                      </th>
                      <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.map((factura) => (
                      <tr
                        key={factura.invoiceId}
                        style={{ borderBottom: "1px solid #ddd" }}
                      >
                        <td style={{ padding: "10px" }}>
                          {factura.invoiceNumber}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {new Date(factura.date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "10px" }}>{factura.cliente}</td>
                        <td style={{ padding: "10px" }}>
                          ${factura.total.toLocaleString()}
                        </td>
                        <td style={{ padding: "10px" }}>{factura.usuario}</td>
                        <td style={{ padding: "10px" }}>
                          <button
                            onClick={() => verDetalleFactura(factura)}
                            style={{
                              padding: "5px 10px",
                              marginRight: "5px",
                              backgroundColor: "#4CAF50",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer",
                            }}
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Detalle de factura */}
        {opcionSeleccionada === "facturas" &&
          mostrarDetalle &&
          facturaDetalle && (
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={volverAListado}
                style={{
                  marginBottom: "20px",
                  padding: "8px 15px",
                  backgroundColor: "#2196F3",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ← Volver al listado
              </button>

              <div
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <h2 style={{ marginTop: 0 }}>
                      Factura #{facturaDetalle.invoiceNumber}
                    </h2>
                    <p>
                      <strong>Fecha:</strong>{" "}
                      {new Date(facturaDetalle.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p>
                      <strong>Total:</strong> $
                      {facturaDetalle.total.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    margin: "20px 0",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "5px",
                      }}
                    >
                      Cliente
                    </h3>
                    <p>
                      <strong>Nombre:</strong> {facturaDetalle.cliente}
                    </p>
                  </div>
                  <div>
                    <h3
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "5px",
                      }}
                    >
                      Vendedor
                    </h3>
                    <p>
                      <strong>Atendido por:</strong> {facturaDetalle.usuario}
                    </p>
                  </div>
                </div>

                <h3
                  style={{
                    borderBottom: "1px solid #eee",
                    paddingBottom: "5px",
                  }}
                >
                  Productos
                </h3>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "10px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Producto
                      </th>
                      <th style={{ padding: "10px", textAlign: "right" }}>
                        Cantidad
                      </th>
                      <th style={{ padding: "10px", textAlign: "right" }}>
                        Precio Unitario
                      </th>
                      <th style={{ padding: "10px", textAlign: "right" }}>
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturaDetalle.detalles.map((detalle, index) => (
                      <tr key={index}>
                        <td style={{ padding: "10px" }}>{detalle.producto}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          {detalle.quantity}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          ${detalle.precioUnitario.toLocaleString()}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          ${detalle.subTotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "10px",
                    borderTop: "1px solid #eee",
                    textAlign: "right",
                  }}
                >
                  <h3>Total: ${facturaDetalle.total.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          )}

        {/* Formulario de factura */}
        {opcionSeleccionada === "venta" && (
          <div style={{ maxWidth: "800px" }}>
            <h1>Generar Factura</h1>
            <form
              onSubmit={handleSubmitFactura}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div>
                  <label>Número de Factura:</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formFactura.invoiceNumber}
                    readOnly
                  />
                </div>
                <div>
                  <label>Fecha:</label>
                  <input
                    type="date"
                    name="date"
                    value={formFactura.date}
                    readOnly
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div>
                  <label>Cliente:</label>
                  <select
                    name="customerId"
                    value={formFactura.customerId}
                    onChange={handleFacturaChange}
                    required
                    style={{ width: "100%", padding: "8px" }}
                  >
                    <option value="">Seleccione un cliente</option>
                    {clientes.map((cliente) => (
                      <option
                        key={cliente.customerId}
                        value={cliente.customerId}
                      >
                        {cliente.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Usuario:</label>
                  <select
                    name="userId"
                    value={formFactura.userId}
                    onChange={handleFacturaChange}
                    required
                    style={{ width: "100%", padding: "8px" }}
                  >
                    {usuarios.map((usuario) => (
                      <option key={usuario.userId} value={usuario.userId}>
                        {usuario.userName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <h3>Productos:</h3>
              {formFactura.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #ddd",
                    padding: "15px",
                    borderRadius: "5px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label>Producto:</label>
                      <select
                        name="productId"
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                        style={{ width: "100%", padding: "8px" }}
                      >
                        <option value="">Seleccione un producto</option>
                        {productos.map((producto) => (
                          <option
                            key={producto.productId}
                            value={producto.productId}
                          >
                            {producto.name} (${producto.price?.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Cantidad:</label>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                        style={{ width: "100%", padding: "8px" }}
                      />
                    </div>
                    <div>
                      <label>Precio Unitario:</label>
                      <input
                        type="number"
                        value={item.unitPrice.toFixed(2)}
                        readOnly
                        style={{ width: "100%", padding: "8px" }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "10px",
                    }}
                  >
                    <div>
                      <strong>Subtotal:</strong> ${item.subTotal.toFixed(2)}
                    </div>
                    {formFactura.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        style={{
                          backgroundColor: "#ff4444",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: "3px",
                          cursor: "pointer",
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  backgroundColor: "#2196F3",
                  color: "white",
                  border: "none",
                  padding: "8px 15px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginBottom: "15px",
                }}
              >
                + Añadir Producto
              </button>

              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "5px",
                  textAlign: "right",
                  fontSize: "18px",
                }}
              >
                <strong>Total Factura:</strong> ${formFactura.total.toFixed(2)}
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "4px",
                  fontSize: "16px",
                  cursor: "pointer",
                  marginTop: "15px",
                }}
              >
                Generar Factura
              </button>
            </form>
          </div>
        )}

        {/* Lista de productos */}
        {opcionSeleccionada === "mostrarProductos" && (
          <div>
            <h1>Lista de Productos</h1>
            {productos.length === 0 ? (
              <p>No hay productos para mostrar.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "20px",
                }}
              >
                {productos.map((producto) => (
                  <div
                    key={producto.productId}
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>{producto.name}</h3>
                    <p>
                      <strong>Descripción:</strong> {producto.description}
                    </p>
                    <p>
                      <strong>Precio:</strong> ${producto.price?.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
