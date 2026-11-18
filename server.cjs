/**
 * Startup file for Phusion Passenger (o2switch "Setup Node.js App").
 * Passenger loads its startup file with require(), which cannot load
 * bin/server.js (ES module with top-level await). A dynamic import can.
 */
import('./bin/server.js')
