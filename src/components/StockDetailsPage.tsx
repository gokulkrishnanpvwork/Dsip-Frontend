// import React, { useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Stock } from '../types';

// interface Props {
//   stocks: Stock[];
//   onUpdateStock: (updated: Stock) => void;
// }

// const StockDetailPage: React.FC<Props> = ({ stocks, onUpdateStock }) => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();

//   const stock = stocks.find(s => s.id === id);
//   if (!stock) return <div className="p-6">Stock not found</div>;

//   const [form, setForm] = useState<Stock>({ ...stock });

//   const update = <K extends keyof Stock>(key: K, value: Stock[K]) => {
//     setForm(prev => ({ ...prev, [key]: value }));
//   };

//   const onSave = () => {
//     onUpdateStock(form);
//     navigate('/');
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6 space-y-8">

//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-900">
//             {stock.symbol}
//           </h1>
//           <p className="text-sm text-slate-500">
//             Full Strategy Details
//           </p>
//         </div>

//         <button
//           onClick={() => navigate(-1)}
//           className="text-slate-500 hover:underline text-sm"
//         >
//           ← Back
//         </button>
//       </div>

//       {/* Position */}
//       <section className="border rounded-xl p-6 space-y-3">
//         <h2 className="text-xs font-bold uppercase text-slate-400">
//           Your Position
//         </h2>

//         <div className="grid grid-cols-2 gap-4">
//           <Field
//             label="Quantity"
//             value={form.quantity}
//             onChange={v => update('quantity', Number(v))}
//           />
//           <Field
//             label="Avg Price"
//             value={form.avgPrice}
//             onChange={v => update('avgPrice', Number(v))}
//           />
//         </div>
//       </section>

//       {/* Strategy */}
//       <section className="border rounded-xl p-6 space-y-3">
//         <h2 className="text-xs font-bold uppercase text-slate-400">
//           Strategy Parameters
//         </h2>

//         <div className="grid grid-cols-2 gap-4">
//           <Field
//             label="Total Budget"
//             value={form.totalBudget}
//             onChange={v => update('totalBudget', Number(v))}
//           />
//           <Field
//             label="Conviction (%)"
//             value={form.conviction}
//             onChange={v => update('conviction', Number(v))}
//           />
//         </div>
//       </section>

//       {/* Thesis */}
//       <section className="border rounded-xl p-6 space-y-3">
//         <h2 className="text-xs font-bold uppercase text-slate-400">
//           Thesis & Notes
//         </h2>

//         <textarea
//           value={form.notes || ''}
//           onChange={e => update('notes', e.target.value)}
//           className="w-full border rounded-lg p-3 text-sm"
//           rows={4}
//         />
//       </section>

//       {/* Actions */}
//       <div className="flex justify-end gap-3">
//         <button
//           onClick={() => navigate(-1)}
//           className="px-5 py-2 text-sm border rounded-lg"
//         >
//           Cancel
//         </button>
//         <button
//           onClick={onSave}
//           className="px-5 py-2 text-sm bg-sky-500 text-white rounded-lg"
//         >
//           Save Changes
//         </button>
//       </div>
//     </div>
//   );
// };

// export default StockDetailPage;

// /* Small reusable field */
// const Field = ({
//   label,
//   value,
//   onChange,
// }: {
//   label: string;
//   value: any;
//   onChange: (v: any) => void;
// }) => (
//   <label className="space-y-1 text-sm">
//     <span className="text-slate-500">{label}</span>
//     <input
//       value={value ?? ''}
//       onChange={e => onChange(e.target.value)}
//       className="w-full border rounded-lg px-3 py-2"
//     />
//   </label>
// );
