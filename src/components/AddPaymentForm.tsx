"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Student = {
  id: string;
  name: string;
  monthly_fee: number;
};

export default function AddPaymentForm({ onPaymentAdded }: { onPaymentAdded?: () => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  // Load existing students into dropdown
  useEffect(() => {
    async function loadStudents() {
      const { data } = await supabase.from("students").select("id, name, monthly_fee");
      if (data && data.length > 0) {
        setStudents(data);
        setStudentId(data[0].id);
        setAmount(data[0].monthly_fee?.toString() || "100");
      }
    }
    loadStudents();
  }, []);

  // Handle student selection change (auto-fill default fee)
  const handleStudentChange = (id: string) => {
    setStudentId(id);
    const matched = students.find((s) => s.id === id);
    if (matched?.monthly_fee) {
      setAmount(matched.monthly_fee.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !amount) return;
    setLoading(true);

    // 1. Add record to payments table
    await supabase.from("payments").insert({
      student_id: studentId,
      amount: parseFloat(amount),
      payment_date: paymentDate,
      payment_method: "Bank Transfer",
    });

    // 2. Update student status in students table
    await supabase
      .from("students")
      .update({
        payment_status: "Paid",
        payment_date: paymentDate,
      })
      .eq("id", studentId);

    setLoading(false);
    setAmount("");
    alert("✅ Payment recorded successfully!");
    if (onPaymentAdded) onPaymentAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4 max-w-md">
      <h3 className="font-bold text-gray-900 text-base">Record Student Payment</h3>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Select Student</label>
        <select
          value={studentId}
          onChange={(e) => handleStudentChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-gray-50 focus:bg-white text-gray-900"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} (Fee: RM {s.monthly_fee})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Amount Paid (RM)</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100.00"
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Payment Date</label>
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Payment"}
      </button>
    </form>
  );
}