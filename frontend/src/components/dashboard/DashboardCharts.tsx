"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardShared";
import { Download } from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { U, I, INK, CAMEL } from "@/lib/tokens";

export function DashboardCharts() {
  const scoreData = [
    { month:"Feb", avg:68, pass:72 },{ month:"Mar", avg:71, pass:75 },{ month:"Apr", avg:69, pass:70 },
    { month:"May", avg:74, pass:78 },{ month:"Jun", avg:76, pass:80 },{ month:"Jul", avg:74, pass:78 },
  ];
  const subjectData = [
    { subject:"Math", avg:77, pass:82 },{ subject:"Science", avg:71, pass:74 },
    { subject:"English", avg:80, pass:88 },{ subject:"History", avg:68, pass:70 },{ subject:"CS", avg:84, pass:91 },
  ];
  const participationData = [
    { month:"Feb", rate:78 },{ month:"Mar", rate:82 },{ month:"Apr", rate:76 },
    { month:"May", rate:88 },{ month:"Jun", rate:91 },{ month:"Jul", rate:87 },
  ];
  const difficultyData = [
    { level:"Easy", pass:95, fail:5 },{ level:"Medium", pass:78, fail:22 },{ level:"Hard", pass:52, fail:48 },
  ];
  const pieData = [{ name:"Passed", value:78.4 },{ name:"Failed", value:21.6 }];
  const PIE_COLORS = ["#22c55e","#ef4444"];
  const tt = { contentStyle:{ border:"1px solid #e5e7eb", borderRadius:12, boxShadow:"0 4px 20px rgba(0,0,0,0.08)", fontFamily:I, fontSize:12 }};

  return (
    <DashboardLayout active="charts" title="Analytics" subtitle="Performance insights across all exams">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="text-sm font-black" style={{ fontFamily:U, color:INK }}>Score & Pass Rate Trend</h3><p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily:I }}>Last 6 months</p></div>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily:U }}><Download size={12}/>Export</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreData} margin={{ top:5, right:20, bottom:0, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false} domain={[60,100]}/>
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
            <BarChart data={subjectData} margin={{ top:0, right:10, bottom:0, left:-20 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="subject" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false} domain={[60,100]}/>
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
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={3} dataKey="value">
                  {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                </Pie>
                <Tooltip {...tt} formatter={(v: number)=>`${v}%`}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {pieData.map((d,i)=>(
                <div key={d.name} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ background:PIE_COLORS[i] }}/>
                  <div><p className="text-xs text-gray-500" style={{ fontFamily:I }}>{d.name}</p><p className="text-lg font-black leading-none" style={{ fontFamily:U, color:INK }}>{d.value}%</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black mb-1" style={{ fontFamily:U, color:INK }}>Participation Rate</h3>
          <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>% of enrolled students who submitted</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={participationData} margin={{ top:5, right:10, bottom:0, left:-20 }}>
              <defs><linearGradient id="partGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CAMEL} stopOpacity={0.2}/><stop offset="95%" stopColor={CAMEL} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fontFamily:I, fill:"#9ca3af" }} axisLine={false} tickLine={false} domain={[60,100]}/>
              <Tooltip {...tt}/>
              <Area type="monotone" dataKey="rate" name="Participation %" stroke={CAMEL} strokeWidth={2.5} fill="url(#partGrad)" dot={{ r:4, fill:CAMEL }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black mb-1" style={{ fontFamily:U, color:INK }}>Difficulty Analysis</h3>
          <p className="text-xs text-gray-400 mb-4" style={{ fontFamily:I }}>Pass vs fail rate by difficulty</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={difficultyData} margin={{ top:0, right:10, bottom:0, left:-20 }} barSize={26}>
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
