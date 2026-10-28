"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Payment = {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  students?: { name: string };
};

type Student = {
  id: string;
  name: string;
  monthly_fee: number;
};

export default function FinancialReport() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentHistory, setStudentHistory] = useState<Payment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    fetchFinancialData();
  }, [selectedMonth]);

  async function fetchFinancialData() {
    const { data: stData } = await supabase.from("students").select("id, name, monthly_fee");
    if (stData) setStudents(stData);

    const startDate = `${selectedMonth}-01`;
    const endDate = `${selectedMonth}-31`;

    const { data: payData } = await supabase
      .from("payments")
      .select("*, students(name)")
      .gte("payment_date", startDate)
      .lte("payment_date", endDate)
      .order("payment_date", { ascending: false });

    if (payData) setPayments(payData as Payment[]);
  }

  async function handleStudentClick(student: Student) {
    setSelectedStudent(student);
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("student_id", student.id)
      .order("payment_date", { ascending: false });

    if (data) setStudentHistory(data as Payment[]);
  }

  const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalExpected = students.reduce((acc, s) => acc + Number(s.monthly_fee || 0), 0);

  return (
    <div className="space-y-6">
      {/* Month Selector & Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Corporate Financial Report</h2>
          <p className="text-xs text-gray-500">Track monthly revenue and individual student ledgers</p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded-lg px-3 py-2 text-xs font-medium border-gray-300 text-gray-900"
        />
      </div>

      {/* Corporate Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">Total Collected</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">RM {totalCollected.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">Target Revenue</p>
          <p className="text-2xl font-black text-gray-800 mt-1">RM {totalExpected.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">Collection Rate</p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Directory & Monthly Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-800 text-sm">Students Directory</h3>
          <div className="divide-y divide-gray-100">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => handleStudentClick(student)}
                className="w-full text-left py-3 px-2 hover:bg-gray-50 rounded-lg flex justify-between items-center transition"
              >
                <div>
                  <p className="font-semibold text-sm text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-400">Fee: RM {student.monthly_fee}</p>
                </div>
                <span className="text-xs text-blue-600 font-medium">View Ledger →</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-800 text-sm">Monthly Transactions Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500 font-medium">
                  <th className="p-2.5">Date Paid</th>
                  <th className="p-2.5">Student</th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-400">No transactions recorded for this month.</td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-2.5 text-gray-600">{p.payment_date}</td>
                      <td className="p-2.5 font-medium text-gray-900">{p.students?.name || "Student"}</td>
                      <td className="p-2.5 text-gray-500">{p.payment_method}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-600">+RM {Number(p.amount).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Individual Student Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-xs text-gray-400">Individual Payment Ledger</p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
              </div>

              <div className="my-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-xs font-semibold text-emerald-700 uppercase">Total Paid To Date</p>
                <p className="text-2xl font-black text-emerald-800 mt-0.5">
                  RM {studentHistory.reduce((acc, h) => acc + Number(h.amount), 0).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-bold uppercase text-gray-400">Payment History</h4>
                <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                  {studentHistory.length === 0 ? (
                    <p className="p-3 text-xs text-gray-400">No payment history found.</p>
                  ) : (
                    studentHistory.map((h) => (
                      <div key={h.id} className="p-3 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{h.payment_date}</p>
                          <p className="text-gray-400">{h.payment_method}</p>
                        </div>
                        <p className="font-bold text-emerald-600">RM {Number(h.amount).toFixed(2)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedStudent(null)}
              className="w-full mt-6 py-2.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}