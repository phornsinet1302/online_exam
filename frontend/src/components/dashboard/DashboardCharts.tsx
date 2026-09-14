"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download } from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { U, I, INK, CAMEL } from "@/lib/tokens";
import { reportsApi, DashboardAnalytics } from "@/lib/api/reports";
import { useEffect, useState } from "react";

export function DashboardCharts() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.getAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const PIE_COLORS = ["#22c55e","#ef4444"];
  const tt = { contentStyle:{ border:"1px solid #e5e7eb", borderRadius:12, boxShadow:"0 4px 20px rgba(0,0,0,0.08)", fontFamily:I, fontSize:12 }};

  if (loading || !data) {
    return <DashboardLayout active="charts" title="Analytics"><div className="p-8 text-center text-gray-500">Loading charts...</div></DashboardLayout>;
  }

  const { scoreTrend, subjectPerformance, participationTrend, difficultyAnalysis, passFailDistribution } = data.chartData;

  return (
    <DashboardLayout active="charts" title="Analytics" subtitle="Performance insights across all exams">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Score & Pass Rate Trend</h3><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Last 6 months</p></div>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}><Download size={12}/>Export</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreTrend} margin={{ top:5, right:20, bottom:0, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false} domain={[0,100]}/>
              <Tooltip {...tt}/>
              <Legend wrapperStyle={{ fontSize:12, fontFamily:I }}/>
              <Line type="monotone" dataKey="avg" name="Avg Score" stroke={INK} strokeWidth={2.5} dot={{ r:4, fill:INK }}/>
              <Line type="monotone" dataKey="pass" name="Pass Rate %" stroke={CAMEL} strokeWidth={2.5} dot={{ r:4, fill:CAMEL }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black mb-1" style={{ fontFamily:U, color:INK }}>Subject Comparison</h3>
          <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>Average score by subject</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={subjectPerformance} margin={{ top:0, right:10, bottom:0, left:-20 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="subject" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false} domain={[0,100]}/>
              <Tooltip {...tt}/>
              <Bar dataKey="avg" name="Avg Score" fill={INK} radius={[6,6,0,0]}/>
              <Bar dataKey="pass" name="Pass %" fill={CAMEL} radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black mb-1" style={{ fontFamily:U, color:INK }}>Pass / Fail Distribution</h3>
          <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>Overall across all exams</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={passFailDistribution} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={3} dataKey="value">
                  {passFailDistribution.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                </Pie>
                <Tooltip {...tt} formatter={(v: number)=>`${v}%`}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {passFailDistribution.map((d,i)=>(
                <div key={d.name} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ background:PIE_COLORS[i] }}/>
                  <div><p className="text-xs text-gray-500" style={{ fontFamily:I }}>{d.name}</p><p className="text-lg font-black leading-none" style={{ fontFamily:U, color:INK }}>{d.value}%</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black mb-1" style={{ fontFamily:U, color:INK }}>Participation Trend</h3>
          <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>Number of exam attempts started per month</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={participationTrend} margin={{ top:5, right:10, bottom:0, left:-20 }}>
              <defs><linearGradient id="partGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CAMEL} stopOpacity={0.2}/><stop offset="95%" stopColor={CAMEL} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip {...tt}/>
              <Area type="monotone" dataKey="rate" name="Attempts Started" stroke={CAMEL} strokeWidth={2.5} fill="url(#partGrad)" dot={{ r:4, fill:CAMEL }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black mb-1" style={{ fontFamily:U, color:INK }}>Difficulty Analysis</h3>
          <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>Pass vs fail rate by difficulty</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={difficultyAnalysis} margin={{ top:0, right:10, bottom:0, left:-20 }} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="level" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <Tooltip {...tt}/>
              <Legend wrapperStyle={{ fontSize:11, fontFamily:I }}/>
              <Bar dataKey="pass" name="Pass %" fill="#22c55e" radius={[6,6,0,0]} stackId="a"/>
              <Bar dataKey="fail" name="Fail %" fill="#fca5a5" stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
