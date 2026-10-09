package main

import (
	"context"
	"net"
	"syscall"
)

// listenUDP binds a UDP socket with SO_REUSEADDR so a quick restart can reclaim
// 127.0.0.1:port after the previous client process exits.
func listenUDP(addr string) (net.PacketConn, error) {
	lc := net.ListenConfig{
		Control: func(network, address string, c syscall.RawConn) error {
			return setReuseAddr(c)
		},
	}
	return lc.ListenPacket(context.Background(), "udp", addr)
}
