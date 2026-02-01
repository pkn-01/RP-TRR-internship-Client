"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  HardDrive,
  RefreshCw,
  Shield,
} from "lucide-react";

interface Backup {
  id: string;
  name: string;
  size: string;
  createdAt: string;
  type: "automatic" | "manual";
  status: "completed" | "in-progress" | "failed";
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      // Simulate backup creation
      const newBackup: Backup = {
        id: `backup-${Date.now()}`,
        name: `Backup-${new Date().toISOString().split("T")[0]}`,
        size: "2.4 GB",
        createdAt: new Date().toISOString(),
        type: "manual",
        status: "in-progress",
      };

      setBackups([newBackup, ...backups]);

      // Simulate completion after 2 seconds
      setTimeout(() => {
        setBackups((prev) =>
          prev.map((b) =>
            b.id === newBackup.id ? { ...b, status: "completed" } : b,
          ),
        );
        setNotification({
          type: "success",
          message: "Backup created successfully",
        });
      }, 2000);
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to create backup",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadBackup = (backup: Backup) => {
    // Simulate download
    const element = document.createElement("a");
    element.href = "#";
    element.download = `${backup.name}.sql`;
    element.click();
  };

  const handleRestoreBackup = (backup: Backup) => {
    if (
      window.confirm(
        `Are you sure you want to restore from ${backup.name}? This will replace the current database.`,
      )
    ) {
      setNotification({
        type: "success",
        message: "Restoring backup... This may take a few minutes.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Backup</h1>
          <p className="text-gray-600 mt-1">
            Manage and restore database backups
          </p>
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <HardDrive size={18} />
              Create Backup
            </>
          )}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {notification.message}
        </div>
      )}

      {/* Storage Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">
              Total Backups
            </h3>
            <Database className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{backups.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Total Size</h3>
            <HardDrive className="text-purple-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {backups
              .reduce(
                (sum, b) =>
                  sum + parseInt(b.size) * (b.size.includes("GB") ? 1024 : 1),
                0,
              )
              .toFixed(1)}{" "}
            MB
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Last Backup</h3>
            <Clock className="text-orange-600" size={24} />
          </div>
          <p className="text-sm font-bold text-gray-900">
            {backups.length > 0
              ? new Date(backups[0].createdAt).toLocaleDateString()
              : "Never"}
          </p>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Backups
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {backups.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Database size={48} className="mx-auto mb-4 opacity-50" />
              <p>No backups yet. Create one to get started.</p>
            </div>
          ) : (
            backups.map((backup) => (
              <div
                key={backup.id}
                className="px-6 py-4 hover:bg-gray-50 transition flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Database size={18} className="text-gray-400" />
                    <h3 className="font-semibold text-gray-900">
                      {backup.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        backup.type === "automatic"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {backup.type === "automatic" ? "Automatic" : "Manual"}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        backup.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : backup.status === "in-progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {backup.status === "completed"
                        ? "Completed"
                        : backup.status === "in-progress"
                          ? "In Progress"
                          : "Failed"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {backup.size} •{" "}
                    {new Date(backup.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadBackup(backup)}
                    disabled={backup.status !== "completed"}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button
                    onClick={() => handleRestoreBackup(backup)}
                    disabled={backup.status !== "completed"}
                    className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Restore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-yellow-700 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-semibold text-yellow-900 mb-1">Important</h3>
          <p className="text-sm text-yellow-800">
            Restoring a backup will replace the current database. Please ensure
            you have a recent backup before performing any restore operation.
          </p>
        </div>
      </div>
    </div>
  );
}
