
import React from "react";
import {
  Camera,
  Radio,
  MapPin,
  Activity,
  Images,
  Wifi,
  Cpu,
  Video,
  Clock3,
  Leaf,
  AlertTriangle,
  ArrowUpRight,
  Signal,
} from "lucide-react";
import { motion } from "motion/react";

const statusItems = [
  {
    title: "Rover connection",
    description: "Communication with rover",
    status: "Not connected",
    icon: Radio,
  },
  {
    title: "Camera system",
    description: "Live camera transmission",
    status: "Awaiting integration",
    icon: Camera,
  },
  {
    title: "Sensor system",
    description: "Field sensor readings",
    status: "Awaiting integration",
    icon: Activity,
  },
  {
    title: "GPS location",
    description: "Rover location tracking",
    status: "Unavailable",
    icon: MapPin,
  },
];

export default function RoverMonitoringView() {
  return (
    <div className="h-full w-full overflow-y-auto bg-[#F4F5F0] text-[#183D32]">
      <div className="mx-auto max-w-[1600px] space-y-7 p-5 md:p-8">

        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col justify-between gap-4 md:flex-row md:items-end"
        >
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#789084]">
              <Leaf size={15} />
              Field operations
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Camera / Live
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718078]">
              Monitor rover connectivity, camera systems and field
              observations collected from the farm.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <AlertTriangle size={17} />
            Rover integration pending
          </div>
        </motion.div>

        {/* Integration notice */}
        <div className="rounded-2xl border border-[#DCE5DC] bg-white p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EDF3ED] text-[#315F48]">
              <Cpu size={23} />
            </div>

            <div className="flex-1">
              <h2 className="font-bold text-[#183D32]">
                Rover system not connected
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#718078]">
                This monitoring interface is ready for rover integration.
                Live video, sensor readings and location information will
                appear here once the hardware and backend communication
                are connected.
              </p>
            </div>

            <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              Pending
            </span>
          </div>
        </div>

        {/* Main monitoring area */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">

          {/* Camera feed */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-2xl border border-[#DCE5DC] bg-white"
          >
            <div className="flex items-center justify-between border-b border-[#EDF0EA] px-5 py-4">
              <div>
                <h2 className="font-bold">Live camera feed</h2>
                <p className="mt-1 text-xs text-[#89968D]">
                  Rover camera transmission
                </p>
              </div>

              <span className="flex items-center gap-2 rounded-full bg-[#F2F3EF] px-3 py-1.5 text-xs font-semibold text-[#89968D]">
                <span className="h-2 w-2 rounded-full bg-[#B6BDB7]" />
                Offline
              </span>
            </div>

            <div className="relative flex aspect-video min-h-[260px] items-center justify-center overflow-hidden bg-[#17251F]">
              <div className="absolute inset-0 opacity-[0.08]">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
                    backgroundSize: "35px 35px",
                  }}
                />
              </div>

              <div className="relative z-10 flex max-w-sm flex-col items-center px-5 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/60">
                  <Video size={30} strokeWidth={1.5} />
                </div>

                <h3 className="text-lg font-semibold text-white">
                  Live feed unavailable
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/50">
                  The rover camera has not been connected to EnFarm yet.
                  The live stream will appear here after integration.
                </p>

                <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
                  <Wifi size={14} />
                  Waiting for rover connection
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-[#89968D]">
                <Clock3 size={14} />
                Last transmission: Not available
              </div>

              <div className="text-xs font-medium text-[#89968D]">
                Camera status: Not connected
              </div>
            </div>
          </motion.section>

          {/* Rover overview */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-[#DCE5DC] bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">Rover overview</h2>
                <p className="mt-1 text-xs text-[#89968D]">
                  Hardware connection status
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3ED] text-[#315F48]">
                <Radio size={20} />
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-[#F5F7F3] p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#718078]">
                  Device status
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  Not connected
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#789084]">
                  <Cpu size={25} />
                </div>
                <div>
                  <p className="font-bold">EnFarm Rover</p>
                  <p className="mt-1 text-xs text-[#89968D]">
                    Hardware awaiting setup
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDF0EA] pb-3">
                <span className="text-sm text-[#718078]">Device ID</span>
                <span className="text-sm font-medium text-[#89968D]">
                  Not assigned
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#EDF0EA] pb-3">
                <span className="text-sm text-[#718078]">Location</span>
                <span className="text-sm font-medium text-[#89968D]">
                  Unavailable
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[#718078]">Last seen</span>
                <span className="text-sm font-medium text-[#89968D]">
                  Not available
                </span>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Hardware status cards */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold">System components</h2>
            <p className="mt-1 text-sm text-[#89968D]">
              Current availability of rover monitoring systems.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statusItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.06 }}
                  className="rounded-2xl border border-[#DCE5DC] bg-white p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3ED] text-[#315F48]">
                      <Icon size={20} />
                    </div>

                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  </div>

                  <h3 className="mt-4 font-bold">{item.title}</h3>

                  <p className="mt-1 text-xs text-[#89968D]">
                    {item.description}
                  </p>

                  <div className="mt-4 border-t border-[#EDF0EA] pt-3">
                    <p className="text-xs font-semibold text-amber-700">
                      {item.status}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Rover image captures */}
        <section className="rounded-2xl border border-[#DCE5DC] bg-white p-5 md:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Images size={19} className="text-[#527660]" />
                <h2 className="font-bold">Rover image captures</h2>
              </div>
              <p className="mt-1 text-sm text-[#89968D]">
                Images collected by the rover during field monitoring.
              </p>
            </div>

            <span className="rounded-lg bg-[#F2F4EF] px-3 py-2 text-xs font-semibold text-[#89968D]">
              No captures available
            </span>
          </div>

          <div className="mt-5 flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-[#D5DED4] bg-[#F8F9F6] px-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#9AA89E]">
              <Camera size={23} />
            </div>

            <h3 className="mt-4 text-sm font-bold text-[#52665A]">
              No rover images recorded
            </h3>

            <p className="mt-2 max-w-md text-xs leading-5 text-[#89968D]">
              Images will appear here when the rover camera is connected
              and begins sending observations to the EnFarm backend.
            </p>
          </div>
        </section>

        {/* Integration workflow */}
        <section className="rounded-2xl border border-[#DCE5DC] bg-white p-5 md:p-6">
          <div className="mb-5">
            <h2 className="font-bold">Rover data workflow</h2>
            <p className="mt-1 text-sm text-[#89968D]">
              How field observations will reach the officer dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-[#F5F7F3] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#527660]">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Rover hardware</p>
                  <p className="text-xs text-[#89968D]">Camera and sensors</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-amber-700">
                Awaiting integration
              </p>
            </div>

            <div className="rounded-xl bg-[#F5F7F3] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#527660]">
                  <Signal size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">EnFarm backend</p>
                  <p className="text-xs text-[#89968D]">Data processing</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-amber-700">
                Rover connection required
              </p>
            </div>

            <div className="rounded-xl bg-[#F5F7F3] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#527660]">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Officer dashboard</p>
                  <p className="text-xs text-[#89968D]">Monitoring and review</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-[#527660]">
                Monitoring interface prepared
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-center gap-2 pb-3 text-xs text-[#A0AAA2]">
          <Leaf size={13} />
          EnFarm field monitoring
        </div>
      </div>
    </div>
  );
}
