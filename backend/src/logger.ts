import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TYPES
// ============================================================================

interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    category: string;
    message: string;
    data?: Record<string, any> | undefined;
}

interface ConnectionLogData {
    userId: string;
    userName?: string | undefined;
    success: boolean;
    reason?: string | undefined;
    ipAddress?: string | undefined;
}

interface RoomJoinLogData {
    userId: string;
    userName?: string;
    roomId: string;
    role: 'owner' | 'guest';
    success: boolean;
    reason?: string;
}

interface GameStartLogData {
    roomId: string;
    ownerId: string;
    guestId: string;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
    private logsDir: string;
    private connectionLogPath: string;
    private roomLogPath: string;
    private gameLogPath: string;
    private errorLogPath: string;

    constructor() {
        // Create logs directory if it doesn't exist
        this.logsDir = path.join(__dirname, 'logs');
        this.ensureLogsDirectory();

        // Define log file paths
        this.connectionLogPath = path.join(this.logsDir, 'connections.log');
        this.roomLogPath = path.join(this.logsDir, 'rooms.log');
        this.gameLogPath = path.join(this.logsDir, 'games.log');
        this.errorLogPath = path.join(this.logsDir, 'errors.log');
    }

    /**
     * Ensure logs directory exists
     */
    private ensureLogsDirectory(): void {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    /**
     * Get formatted timestamp
     */
    private getTimestamp(): string {
        return new Date().toISOString();
    }

    /**
     * Format log entry as string
     */
    private formatLogEntry(entry: LogEntry): string {
        const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
        return `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}${dataStr}\n`;
    }

    /**
     * Write to log file
     */
    private writeToFile(filePath: string, content: string): void {
        try {
            fs.appendFileSync(filePath, content, 'utf8');
        } catch (error) {
            console.error(`Failed to write to log file ${filePath}:`, error);
        }
    }

    /**
     * Generic log method
     */
    private log(
        filePath: string,
        level: LogEntry['level'],
        category: string,
        message: string,
        data?: Record<string, any>
    ): void {
        const entry: LogEntry = {
            timestamp: this.getTimestamp(),
            level,
            category,
            message,
            data,
        };

        const formattedEntry = this.formatLogEntry(entry);
        this.writeToFile(filePath, formattedEntry);

        // Also log to console for debugging
        if (level === 'ERROR') {
            console.error(formattedEntry.trim());
        } else {
            console.log(formattedEntry.trim());
        }
    }

    // ============================================================================
    // CONNECTION LOGS
    // ============================================================================

    /**
     * Log WebSocket connection attempt
     */
    logConnectionAttempt(userId: string, userName?: string, ipAddress?: string): void {
        this.log(
            this.connectionLogPath,
            'INFO',
            'CONNECTION_ATTEMPT',
            `User attempting to connect`,
            { userId, userName, ipAddress }
        );
    }

    /**
     * Log successful WebSocket connection
     */
    logConnectionSuccess(data: ConnectionLogData): void {
        this.log(
            this.connectionLogPath,
            'INFO',
            'CONNECTION_SUCCESS',
            `User connected successfully`,
            data
        );
    }

    /**
     * Log failed WebSocket connection
     */
    logConnectionFailure(data: ConnectionLogData): void {
        this.log(
            this.connectionLogPath,
            'WARN',
            'CONNECTION_FAILURE',
            `User connection failed`,
            data
        );
    }

    /**
     * Log WebSocket disconnection
     */
    logDisconnection(userId: string, userName?: string): void {
        this.log(
            this.connectionLogPath,
            'INFO',
            'DISCONNECTION',
            `User disconnected`,
            { userId, userName }
        );
    }

    // ============================================================================
    // ROOM LOGS
    // ============================================================================

    /**
     * Log room creation
     */
    logRoomCreation(roomId: string, ownerId: string, ownerName?: string): void {
        this.log(
            this.roomLogPath,
            'INFO',
            'ROOM_CREATED',
            `Room created`,
            { roomId, ownerId, ownerName }
        );
    }

    /**
     * Log room join attempt
     */
    logRoomJoinAttempt(data: Omit<RoomJoinLogData, 'success'>): void {
        this.log(
            this.roomLogPath,
            'INFO',
            'ROOM_JOIN_ATTEMPT',
            `User attempting to join room`,
            data
        );
    }

    /**
     * Log successful room join
     */
    logRoomJoinSuccess(data: RoomJoinLogData): void {
        this.log(
            this.roomLogPath,
            'INFO',
            'ROOM_JOIN_SUCCESS',
            `User joined room successfully`,
            data
        );
    }

    /**
     * Log failed room join
     */
    logRoomJoinFailure(data: RoomJoinLogData): void {
        this.log(
            this.roomLogPath,
            'WARN',
            'ROOM_JOIN_FAILURE',
            `User failed to join room`,
            data
        );
    }

    /**
     * Log room cleanup
     */
    logRoomCleanup(roomId: string, reason: string): void {
        this.log(
            this.roomLogPath,
            'INFO',
            'ROOM_CLEANUP',
            `Room cleaned up`,
            { roomId, reason }
        );
    }

    // ============================================================================
    // GAME LOGS
    // ============================================================================

    /**
     * Log game start
     */
    logGameStart(data: GameStartLogData): void {
        this.log(
            this.gameLogPath,
            'INFO',
            'GAME_START',
            `Game started`,
            data
        );
    }

    /**
     * Log game end
     */
    logGameEnd(roomId: string, winner?: string, reason?: string): void {
        this.log(
            this.gameLogPath,
            'INFO',
            'GAME_END',
            `Game ended`,
            { roomId, winner, reason }
        );
    }

    // ============================================================================
    // ERROR LOGS
    // ============================================================================

    /**
     * Log general error
     */
    logError(category: string, message: string, error?: any): void {
        const errorData: Record<string, any> = {};

        if (error) {
            errorData.error = error.message || error;
            if (error.stack) {
                errorData.stack = error.stack;
            }
        }

        this.log(
            this.errorLogPath,
            'ERROR',
            category,
            message,
            errorData
        );
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Rotate log files if they exceed size limit (10MB)
     */
    rotateLogsIfNeeded(): void {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const logFiles = [
            this.connectionLogPath,
            this.roomLogPath,
            this.gameLogPath,
            this.errorLogPath,
        ];

        logFiles.forEach((logPath) => {
            if (fs.existsSync(logPath)) {
                const stats = fs.statSync(logPath);
                if (stats.size > maxSize) {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const backupPath = logPath.replace('.log', `.${timestamp}.log`);
                    fs.renameSync(logPath, backupPath);
                    console.log(`Rotated log file: ${logPath} -> ${backupPath}`);
                }
            }
        });
    }

    /**
     * Clear all logs (use with caution)
     */
    clearLogs(): void {
        const logFiles = [
            this.connectionLogPath,
            this.roomLogPath,
            this.gameLogPath,
            this.errorLogPath,
        ];

        logFiles.forEach((logPath) => {
            if (fs.existsSync(logPath)) {
                fs.unlinkSync(logPath);
            }
        });

        console.log('All log files cleared');
    }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const logger = new Logger();

// Rotate logs on startup
logger.rotateLogsIfNeeded();

// Set up periodic log rotation (daily)
setInterval(() => {
    logger.rotateLogsIfNeeded();
}, 24 * 60 * 60 * 1000);